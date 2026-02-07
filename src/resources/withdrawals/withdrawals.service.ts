import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/knex.service';
import {
  BALANCES_TABLE,
  LEDGER_ENTRIES_TABLE,
  TRANSACTION_INTENTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
  WITHDRAWALS_TABLE,
} from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_BALANCE,
  ID_PREFIX_LEDGER,
  ID_PREFIX_TRANSACTION_INTENT,
  ID_PREFIX_USER,
  ID_PREFIX_WALLET,
  ID_PREFIX_WITHDRAWAL,
  ID_PREFIX_WITHDRAWAL_REFERENCE,
} from 'src/common/constants/id-prefix.constants';
import { AuditAction, EntityType } from 'src/tables/audit_log.table';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { LedgerEntryType } from 'src/tables/ledger_entry.table';
import {
  TransactionIntentDirection,
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
import { UserStatus } from 'src/tables/user.table';
import { WalletStatus } from 'src/tables/wallet.table';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalStatus } from '../../tables/withdrawal.table';

@Injectable()
export class WithdrawalsService {
  private readonly clearingEmail = 'clearing@lendsqr.local';

  constructor(
    private readonly knex: DatabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createWithdrawalDto: CreateWithdrawalDto) {
    const amount = Number.parseFloat(createWithdrawalDto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.assertWalletAllowed(
      createWithdrawalDto.wallet_id,
    );

    const reference = generateId(ID_PREFIX_WITHDRAWAL_REFERENCE);
    const transactionIntentId = generateId(ID_PREFIX_TRANSACTION_INTENT);
    const withdrawalId = generateId(ID_PREFIX_WITHDRAWAL);
    const amountValue = amount.toFixed(2);

    const response = await this.knex.getDb().transaction(async (trx) => {
      await trx.table(TRANSACTION_INTENTS_TABLE).insert({
        id: transactionIntentId,
        wallet_id: createWithdrawalDto.wallet_id,
        type: TransactionIntentType.Withdrawal,
        direction: TransactionIntentDirection.Debit,
        amount: amountValue,
        status: TransactionIntentStatus.Created,
        reference,
        idempotency_key: createWithdrawalDto.idempotency_key,
        metadata: { destination: createWithdrawalDto.destination },
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.CreateIntent,
          metadata: {
            amount: amountValue,
            reference,
            wallet_id: createWithdrawalDto.wallet_id,
            destination: createWithdrawalDto.destination,
          },
        }),
        trx,
      );

      await trx
        .table(TRANSACTION_INTENTS_TABLE)
        .where({ id: transactionIntentId })
        .update({
          status: TransactionIntentStatus.Processing,
        });

      await trx.table(WITHDRAWALS_TABLE).insert({
        id: withdrawalId,
        wallet_id: createWithdrawalDto.wallet_id,
        amount: amountValue,
        status: WithdrawalStatus.Pending,
        reference,
        destination: createWithdrawalDto.destination,
        transaction_intent_id: transactionIntentId,
      });

      const clearingWalletId = await this.getOrCreateClearingWallet(
        trx,
        wallet.currency,
      );

      const walletBalance = await this.getOrCreateBalance(
        trx,
        createWithdrawalDto.wallet_id,
      );
      const clearingBalance = await this.getOrCreateBalance(
        trx,
        clearingWalletId,
      );

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
        await trx.table(WITHDRAWALS_TABLE).where({ id: withdrawalId }).update({
          status: WithdrawalStatus.Failed,
        });

        await this.auditLogsService.createLog(
          this.auditLogsService.buildSystemLog({
            entity_type: EntityType.TransactionIntent,
            entity_id: transactionIntentId,
            action: AuditAction.TxnFailed,
            metadata: {
              reason: 'Insufficient funds',
              wallet_id: createWithdrawalDto.wallet_id,
            },
          }),
          trx,
        );

        return {
          withdrawal_id: withdrawalId,
          transaction_intent_id: transactionIntentId,
          wallet_id: createWithdrawalDto.wallet_id,
          amount: amountValue,
          status: WithdrawalStatus.Failed,
          reference,
          destination: createWithdrawalDto.destination,
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
          wallet_id: createWithdrawalDto.wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Debit,
          amount: amountValue,
          balance_before: walletBefore.toFixed(2),
          balance_after: walletAfter.toFixed(2),
        },
        {
          id: creditEntryId,
          wallet_id: clearingWalletId,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Credit,
          amount: amountValue,
          balance_before: clearingBefore.toFixed(2),
          balance_after: clearingAfter.toFixed(2),
        },
      ]);

      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: createWithdrawalDto.wallet_id })
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
            wallet_id: createWithdrawalDto.wallet_id,
            entry_type: LedgerEntryType.Debit,
            amount: amountValue,
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
            amount: amountValue,
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
            wallet_id: createWithdrawalDto.wallet_id,
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
      await trx.table(WITHDRAWALS_TABLE).where({ id: withdrawalId }).update({
        status: WithdrawalStatus.Success,
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.SettleTxn,
          metadata: {
            amount: amountValue,
            reference,
            ledger_entry_ids: [debitEntryId, creditEntryId],
          },
        }),
        trx,
      );

      return {
        withdrawal_id: withdrawalId,
        transaction_intent_id: transactionIntentId,
        wallet_id: createWithdrawalDto.wallet_id,
        amount: amountValue,
        status: WithdrawalStatus.Success,
        reference,
        destination: createWithdrawalDto.destination,
      };
    });

    return response;
  }

  private async assertWalletAllowed(walletId: string) {
    const wallet = await this.knex.findOne(WALLETS_TABLE, { id: walletId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    const user = await this.knex.findOne(USERS_TABLE, { id: wallet.user_id });
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
