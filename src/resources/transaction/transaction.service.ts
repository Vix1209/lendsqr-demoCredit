import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BALANCES_TABLE,
  FUNDINGS_TABLE,
  LEDGER_ENTRIES_TABLE,
  TRANSACTION_INTENTS_TABLE,
  TRANSFERS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
  WITHDRAWALS_TABLE,
} from 'src/common/constants/table-names.constants';
import {
  ID_PREFIX_BALANCE,
  ID_PREFIX_LEDGER,
  ID_PREFIX_USER,
  ID_PREFIX_WALLET,
} from 'src/common/constants/id-prefix.constants';
import { generateId } from 'src/common/utils/customId.utils';
import { DatabaseService } from 'src/database/knex.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, EntityType } from 'src/tables/audit_log.table';
import { LedgerEntryType } from 'src/tables/ledger_entry.table';
import {
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
import { FundingStatus } from 'src/tables/funding.table';
import { TransferStatus } from 'src/tables/transfer.table';
import { WithdrawalStatus } from 'src/tables/withdrawal.table';
import { UserStatus } from 'src/tables/user.table';
import { WalletStatus } from 'src/tables/wallet.table';
import {
  ExecuteTransactionDto,
  TransactionExecutionType,
} from './dto/execute-transaction.dto';

@Injectable()
export class TransactionService {
  private readonly clearingEmail = 'clearing@lendsqr.local';

  constructor(
    private readonly knex: DatabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async execute(input: ExecuteTransactionDto) {
    if (input.type === TransactionExecutionType.Funding) {
      return this.executeFunding(input.transaction_intent_id);
    }
    if (input.type === TransactionExecutionType.Transfer) {
      return this.executeTransfer(input.transaction_intent_id);
    }
    return this.executeWithdrawal(input.transaction_intent_id);
  }

  private async executeFunding(transactionIntentId: string) {
    return this.knex.getDb().transaction(async (trx) => {
      const intent = await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .first();
      if (!intent) {
        throw new NotFoundException('Transaction intent not found');
      }
      if (intent.type !== TransactionIntentType.Funding) {
        throw new BadRequestException('Transaction intent type mismatch');
      }
      if (intent.status !== TransactionIntentStatus.Pending) {
        throw new BadRequestException('Transaction intent is not pending');
      }

      const funding = await trx
        .table(FUNDINGS_TABLE)
        .where({ transaction_intent_id: transactionIntentId })
        .first();
      if (!funding) {
        throw new NotFoundException('Funding request not found');
      }

      const wallet = await trx
        .table(WALLETS_TABLE)
        .where({ id: funding.wallet_id })
        .first();
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      const user = await trx
        .table(USERS_TABLE)
        .where({ id: wallet.user_id })
        .first();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.status === UserStatus.Blacklisted) {
        throw new ForbiddenException('User is blacklisted');
      }

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Processing,
        });

      const processorResult = this.processFunding(funding.provider);
      if (!processorResult.success) {
        await trx
          .table(TRANSACTION_INTENTS_TABLE)
          .where({ id: transactionIntentId })
          .update({
            status: TransactionIntentStatus.Failed,
          });
        await trx.table(FUNDINGS_TABLE).where({ id: funding.id }).update({
          status: FundingStatus.Failed,
        });

        await this.auditLogsService.createLog(
          this.auditLogsService.buildSystemLog({
            entity_type: EntityType.TransactionIntent,
            entity_id: transactionIntentId,
            action: AuditAction.TxnFailed,
            metadata: {
              reason: 'Processor failed',
              wallet_id: funding.wallet_id,
            },
          }),
          trx,
        );

        return {
          funding_id: funding.id,
          transaction_intent_id: transactionIntentId,
          wallet_id: funding.wallet_id,
          amount: funding.amount,
          status: FundingStatus.Failed,
          reference: funding.reference,
          provider: funding.provider,
        };
      }

      const clearingWalletId = await this.getOrCreateClearingWallet(
        trx,
        wallet.currency,
      );

      const walletBalance = await this.getOrCreateBalance(
        trx,
        funding.wallet_id,
      );
      const clearingBalance = await this.getOrCreateBalance(
        trx,
        clearingWalletId,
      );

      const amount = Number.parseFloat(funding.amount);
      const walletBefore = Number.parseFloat(walletBalance.available_balance);
      const walletAfter = Number.parseFloat((walletBefore + amount).toFixed(2));
      const clearingBefore = Number.parseFloat(
        clearingBalance.available_balance,
      );
      const clearingAfter = Number.parseFloat(
        (clearingBefore - amount).toFixed(2),
      );

      const creditEntryId = generateId(ID_PREFIX_LEDGER);
      const debitEntryId = generateId(ID_PREFIX_LEDGER);

      await trx.table(LEDGER_ENTRIES_TABLE).insert([
        {
          id: creditEntryId,
          wallet_id: funding.wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Credit,
          amount: funding.amount,
          balance_before: walletBefore.toFixed(2),
          balance_after: walletAfter.toFixed(2),
        },
        {
          id: debitEntryId,
          wallet_id: clearingWalletId,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Debit,
          amount: funding.amount,
          balance_before: clearingBefore.toFixed(2),
          balance_after: clearingAfter.toFixed(2),
        },
      ]);

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: creditEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: funding.wallet_id,
            entry_type: LedgerEntryType.Credit,
            amount: funding.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );
      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: debitEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: clearingWalletId,
            entry_type: LedgerEntryType.Debit,
            amount: funding.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );

      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: funding.wallet_id })
        .update({
          available_balance: walletAfter.toFixed(2),
        });
      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: clearingWalletId })
        .update({
          available_balance: clearingAfter.toFixed(2),
        });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: walletBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: funding.wallet_id,
            available_balance_before: walletBefore,
            available_balance_after: walletAfter,
            change: amount,
          },
        }),
        trx,
      );
      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: clearingBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: clearingWalletId,
            available_balance_before: clearingBefore,
            available_balance_after: clearingAfter,
            change: -amount,
          },
        }),
        trx,
      );

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Settled,
        });
      await trx.table(FUNDINGS_TABLE).where({ id: funding.id }).update({
        status: FundingStatus.Success,
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.SettleTxn,
          metadata: {
            amount: funding.amount,
            reference: funding.reference,
            ledger_entry_ids: [creditEntryId, debitEntryId],
          },
        }),
        trx,
      );

      return {
        funding_id: funding.id,
        transaction_intent_id: transactionIntentId,
        wallet_id: funding.wallet_id,
        amount: funding.amount,
        status: FundingStatus.Success,
        reference: funding.reference,
        provider: funding.provider,
      };
    });
  }

  private async executeTransfer(transactionIntentId: string) {
    return this.knex.getDb().transaction(async (trx) => {
      const intent = await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .first();
      if (!intent) {
        throw new NotFoundException('Transaction intent not found');
      }
      if (intent.type !== TransactionIntentType.Transfer) {
        throw new BadRequestException('Transaction intent type mismatch');
      }
      if (intent.status !== TransactionIntentStatus.Pending) {
        throw new BadRequestException('Transaction intent is not pending');
      }

      const transfer = await trx
        .table(TRANSFERS_TABLE)
        .where({ transaction_intent_id: transactionIntentId })
        .first();
      if (!transfer) {
        throw new NotFoundException('Transfer request not found');
      }

      const senderWallet = await this.assertWalletAllowed(
        trx,
        transfer.sender_wallet_id,
      );
      const receiverWallet = await this.assertWalletAllowed(
        trx,
        transfer.receiver_wallet_id,
      );

      if (senderWallet.currency !== receiverWallet.currency) {
        throw new BadRequestException('Wallet currencies must match');
      }

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Processing,
        });

      const senderBalance = await this.getOrCreateBalance(
        trx,
        transfer.sender_wallet_id,
      );
      const receiverBalance = await this.getOrCreateBalance(
        trx,
        transfer.receiver_wallet_id,
      );

      const amount = Number.parseFloat(transfer.amount);
      const senderBefore = Number.parseFloat(senderBalance.available_balance);
      const receiverBefore = Number.parseFloat(
        receiverBalance.available_balance,
      );

      if (senderBefore < amount) {
        await trx
          .table(TRANSACTION_INTENTS_TABLE)
          .where({ id: transactionIntentId })
          .update({
            status: TransactionIntentStatus.Failed,
          });
        await trx.table(TRANSFERS_TABLE).where({ id: transfer.id }).update({
          status: TransferStatus.Failed,
        });

        await this.auditLogsService.createLog(
          this.auditLogsService.buildSystemLog({
            entity_type: EntityType.TransactionIntent,
            entity_id: transactionIntentId,
            action: AuditAction.TxnFailed,
            metadata: {
              reason: 'Insufficient funds',
              sender_wallet_id: transfer.sender_wallet_id,
            },
          }),
          trx,
        );

        return {
          transfer_id: transfer.id,
          transaction_intent_id: transactionIntentId,
          sender_wallet_id: transfer.sender_wallet_id,
          receiver_wallet_id: transfer.receiver_wallet_id,
          amount: transfer.amount,
          status: TransferStatus.Failed,
          reference: transfer.reference,
        };
      }

      const senderAfter = Number.parseFloat((senderBefore - amount).toFixed(2));
      const receiverAfter = Number.parseFloat(
        (receiverBefore + amount).toFixed(2),
      );

      const debitEntryId = generateId(ID_PREFIX_LEDGER);
      const creditEntryId = generateId(ID_PREFIX_LEDGER);

      await trx.table(LEDGER_ENTRIES_TABLE).insert([
        {
          id: debitEntryId,
          wallet_id: transfer.sender_wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Debit,
          amount: transfer.amount,
          balance_before: senderBefore.toFixed(2),
          balance_after: senderAfter.toFixed(2),
        },
        {
          id: creditEntryId,
          wallet_id: transfer.receiver_wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Credit,
          amount: transfer.amount,
          balance_before: receiverBefore.toFixed(2),
          balance_after: receiverAfter.toFixed(2),
        },
      ]);

      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: transfer.sender_wallet_id })
        .update({
          available_balance: senderAfter.toFixed(2),
        });
      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: transfer.receiver_wallet_id })
        .update({
          available_balance: receiverAfter.toFixed(2),
        });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: debitEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: transfer.sender_wallet_id,
            entry_type: LedgerEntryType.Debit,
            amount: transfer.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );
      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: creditEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: transfer.receiver_wallet_id,
            entry_type: LedgerEntryType.Credit,
            amount: transfer.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: senderBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: transfer.sender_wallet_id,
            available_balance_before: senderBefore,
            available_balance_after: senderAfter,
            change: -amount,
          },
        }),
        trx,
      );

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: receiverBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: transfer.receiver_wallet_id,
            available_balance_before: receiverBefore,
            available_balance_after: receiverAfter,
            change: amount,
          },
        }),
        trx,
      );

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Settled,
        });
      await trx.table(TRANSFERS_TABLE).where({ id: transfer.id }).update({
        status: TransferStatus.Success,
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.SettleTxn,
          metadata: {
            amount: transfer.amount,
            reference: transfer.reference,
            ledger_entry_ids: [debitEntryId, creditEntryId],
          },
        }),
        trx,
      );

      return {
        transfer_id: transfer.id,
        transaction_intent_id: transactionIntentId,
        sender_wallet_id: transfer.sender_wallet_id,
        receiver_wallet_id: transfer.receiver_wallet_id,
        amount: transfer.amount,
        status: TransferStatus.Success,
        reference: transfer.reference,
      };
    });
  }

  private async executeWithdrawal(transactionIntentId: string) {
    return this.knex.getDb().transaction(async (trx) => {
      const intent = await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .first();
      if (!intent) {
        throw new NotFoundException('Transaction intent not found');
      }
      if (intent.type !== TransactionIntentType.Withdrawal) {
        throw new BadRequestException('Transaction intent type mismatch');
      }
      if (intent.status !== TransactionIntentStatus.Pending) {
        throw new BadRequestException('Transaction intent is not pending');
      }

      const withdrawal = await trx
        .table(WITHDRAWALS_TABLE)
        .where({ transaction_intent_id: transactionIntentId })
        .first();
      if (!withdrawal) {
        throw new NotFoundException('Withdrawal request not found');
      }

      const wallet = await this.assertWalletAllowed(trx, withdrawal.wallet_id);

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Processing,
        });

      const clearingWalletId = await this.getOrCreateClearingWallet(
        trx,
        wallet.currency,
      );

      const walletBalance = await this.getOrCreateBalance(
        trx,
        withdrawal.wallet_id,
      );
      const clearingBalance = await this.getOrCreateBalance(
        trx,
        clearingWalletId,
      );

      const amount = Number.parseFloat(withdrawal.amount);
      const walletBefore = Number.parseFloat(walletBalance.available_balance);
      const clearingBefore = Number.parseFloat(
        clearingBalance.available_balance,
      );

      if (walletBefore < amount) {
        await trx
          .table(TRANSACTION_INTENTS_TABLE)
          .where({ id: transactionIntentId })
          .update({
            status: TransactionIntentStatus.Failed,
          });
        await trx.table(WITHDRAWALS_TABLE).where({ id: withdrawal.id }).update({
          status: WithdrawalStatus.Failed,
        });

        await this.auditLogsService.createLog(
          this.auditLogsService.buildSystemLog({
            entity_type: EntityType.TransactionIntent,
            entity_id: transactionIntentId,
            action: AuditAction.TxnFailed,
            metadata: {
              reason: 'Insufficient funds',
              wallet_id: withdrawal.wallet_id,
            },
          }),
          trx,
        );

        return {
          withdrawal_id: withdrawal.id,
          transaction_intent_id: transactionIntentId,
          wallet_id: withdrawal.wallet_id,
          amount: withdrawal.amount,
          status: WithdrawalStatus.Failed,
          reference: withdrawal.reference,
          destination: withdrawal.destination,
        };
      }

      const walletAfter = Number.parseFloat((walletBefore - amount).toFixed(2));
      const clearingAfter = Number.parseFloat(
        (clearingBefore + amount).toFixed(2),
      );

      const debitEntryId = generateId(ID_PREFIX_LEDGER);
      const creditEntryId = generateId(ID_PREFIX_LEDGER);

      await trx.table(LEDGER_ENTRIES_TABLE).insert([
        {
          id: debitEntryId,
          wallet_id: withdrawal.wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Debit,
          amount: withdrawal.amount,
          balance_before: walletBefore.toFixed(2),
          balance_after: walletAfter.toFixed(2),
        },
        {
          id: creditEntryId,
          wallet_id: clearingWalletId,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Credit,
          amount: withdrawal.amount,
          balance_before: clearingBefore.toFixed(2),
          balance_after: clearingAfter.toFixed(2),
        },
      ]);

      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: withdrawal.wallet_id })
        .update({
          available_balance: walletAfter.toFixed(2),
        });
      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: clearingWalletId })
        .update({
          available_balance: clearingAfter.toFixed(2),
        });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: debitEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: withdrawal.wallet_id,
            entry_type: LedgerEntryType.Debit,
            amount: withdrawal.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );
      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: creditEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: clearingWalletId,
            entry_type: LedgerEntryType.Credit,
            amount: withdrawal.amount,
            transaction_intent_id: transactionIntentId,
          },
        }),
        trx,
      );

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: walletBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: withdrawal.wallet_id,
            available_balance_before: walletBefore,
            available_balance_after: walletAfter,
            change: -amount,
          },
        }),
        trx,
      );

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.Balance,
          entity_id: clearingBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: clearingWalletId,
            available_balance_before: clearingBefore,
            available_balance_after: clearingAfter,
            change: amount,
          },
        }),
        trx,
      );

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Settled,
        });
      await trx.table(WITHDRAWALS_TABLE).where({ id: withdrawal.id }).update({
        status: WithdrawalStatus.Success,
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.SettleTxn,
          metadata: {
            amount: withdrawal.amount,
            reference: withdrawal.reference,
            ledger_entry_ids: [debitEntryId, creditEntryId],
          },
        }),
        trx,
      );

      return {
        withdrawal_id: withdrawal.id,
        transaction_intent_id: transactionIntentId,
        wallet_id: withdrawal.wallet_id,
        amount: withdrawal.amount,
        status: WithdrawalStatus.Success,
        reference: withdrawal.reference,
        destination: withdrawal.destination,
      };
    });
  }

  private processFunding(provider: string) {
    if (provider === 'fail') {
      return { success: false };
    }
    return { success: true };
  }

  private async assertWalletAllowed(trx: any, walletId: string) {
    const wallet = await trx
      .table(WALLETS_TABLE)
      .where({ id: walletId })
      .first();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    const user = await trx
      .table(USERS_TABLE)
      .where({ id: wallet.user_id })
      .first();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === UserStatus.Blacklisted) {
      throw new ForbiddenException('User is blacklisted');
    }
    return wallet;
  }

  private async getOrCreateClearingWallet(trx: any, currency: string) {
    let user = await trx
      .table(USERS_TABLE)
      .where({ email: this.clearingEmail })
      .first();
    if (!user) {
      const userId = generateId(ID_PREFIX_USER);
      await trx.table(USERS_TABLE).insert({
        id: userId,
        email: this.clearingEmail,
        first_name: 'Clearing',
        last_name: 'Account',
        phone_number: null,
        status: UserStatus.Active,
      });
      user = { id: userId };
    }

    let wallet = await trx
      .table(WALLETS_TABLE)
      .where({ user_id: user.id, currency })
      .first();
    if (!wallet) {
      const walletId = generateId(ID_PREFIX_WALLET);
      await trx.table(WALLETS_TABLE).insert({
        id: walletId,
        user_id: user.id,
        currency,
        account_details: { bank_account_number: '', bank_code: '' },
        status: WalletStatus.Active,
      });
      await trx.table(BALANCES_TABLE).insert({
        id: generateId(ID_PREFIX_BALANCE),
        wallet_id: walletId,
        available_balance: '0.00',
        pending_balance: '0.00',
      });
      wallet = { id: walletId };
    }

    return wallet.id as string;
  }

  private async getOrCreateBalance(trx: any, walletId: string) {
    let balance = await trx
      .table(BALANCES_TABLE)
      .where({ wallet_id: walletId })
      .first();
    if (!balance) {
      const balanceId = generateId(ID_PREFIX_BALANCE);
      await trx.table(BALANCES_TABLE).insert({
        id: balanceId,
        wallet_id: walletId,
        available_balance: '0.00',
        pending_balance: '0.00',
      });
      balance = {
        id: balanceId,
        wallet_id: walletId,
        available_balance: '0.00',
      };
    }
    return balance;
  }
}
