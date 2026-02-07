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
  TRANSFERS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_BALANCE,
  ID_PREFIX_LEDGER,
  ID_PREFIX_TRANSACTION_INTENT,
  ID_PREFIX_TRANSFER,
  ID_PREFIX_TRANSFER_REFERENCE,
} from 'src/common/constants/id-prefix.constants';
import {
  TransactionIntentDirection,
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
import { LedgerEntryType } from 'src/tables/ledger_entry.table';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { AuditAction, EntityType } from 'src/tables/audit_log.table';
import { UserStatus } from 'src/tables/user.table';
import {
  CreateTransferDto,
  TransferHistoryQueryDto,
} from './dto/create-transfer.dto';
import { TransferStatus } from '../../tables/transfer.table';

@Injectable()
export class TransfersService {
  constructor(
    private readonly knex: DatabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createTransferDto: CreateTransferDto) {
    const amount = Number.parseFloat(createTransferDto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (
      createTransferDto.sender_wallet_id ===
      createTransferDto.receiver_wallet_id
    ) {
      throw new BadRequestException('Sender and receiver must be different');
    }

    const senderWallet = await this.assertWalletAllowed(
      createTransferDto.sender_wallet_id,
    );
    const receiverWallet = await this.assertWalletAllowed(
      createTransferDto.receiver_wallet_id,
    );

    if (senderWallet.currency !== receiverWallet.currency) {
      throw new BadRequestException('Wallet currencies must match');
    }

    const reference = generateId(ID_PREFIX_TRANSFER_REFERENCE);
    const transactionIntentId = generateId(ID_PREFIX_TRANSACTION_INTENT);
    const transferId = generateId(ID_PREFIX_TRANSFER);
    const amountValue = amount.toFixed(2);

    const response = await this.knex.getDb().transaction(async (trx) => {
      await trx.table(TRANSACTION_INTENTS_TABLE).insert({
        id: transactionIntentId,
        wallet_id: createTransferDto.sender_wallet_id,
        type: TransactionIntentType.Transfer,
        direction: TransactionIntentDirection.Internal,
        amount: amountValue,
        status: TransactionIntentStatus.Created,
        reference,
        idempotency_key: createTransferDto.idempotency_key,
        metadata: {
          sender_wallet_id: createTransferDto.sender_wallet_id,
          receiver_wallet_id: createTransferDto.receiver_wallet_id,
        },
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.CreateIntent,
          metadata: {
            amount: amountValue,
            reference,
            sender_wallet_id: createTransferDto.sender_wallet_id,
            receiver_wallet_id: createTransferDto.receiver_wallet_id,
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

      await trx.table(TRANSFERS_TABLE).insert({
        id: transferId,
        sender_wallet_id: createTransferDto.sender_wallet_id,
        receiver_wallet_id: createTransferDto.receiver_wallet_id,
        amount: amountValue,
        status: TransferStatus.Pending,
        reference,
        transaction_intent_id: transactionIntentId,
      });

      const senderBalance = await this.getOrCreateBalance(
        trx,
        createTransferDto.sender_wallet_id,
      );
      const receiverBalance = await this.getOrCreateBalance(
        trx,
        createTransferDto.receiver_wallet_id,
      );

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
        await trx.table(TRANSFERS_TABLE).where({ id: transferId }).update({
          status: TransferStatus.Failed,
        });

        await this.auditLogsService.createLog(
          this.auditLogsService.buildSystemLog({
            entity_type: EntityType.TransactionIntent,
            entity_id: transactionIntentId,
            action: AuditAction.TxnFailed,
            metadata: {
              reason: 'Insufficient funds',
              sender_wallet_id: createTransferDto.sender_wallet_id,
            },
          }),
          trx,
        );

        return {
          transfer_id: transferId,
          transaction_intent_id: transactionIntentId,
          sender_wallet_id: createTransferDto.sender_wallet_id,
          receiver_wallet_id: createTransferDto.receiver_wallet_id,
          amount: amountValue,
          status: TransferStatus.Failed,
          reference,
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
          wallet_id: createTransferDto.sender_wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Debit,
          amount: amountValue,
          balance_before: senderBefore.toFixed(2),
          balance_after: senderAfter.toFixed(2),
        },
        {
          id: creditEntryId,
          wallet_id: createTransferDto.receiver_wallet_id,
          transaction_intent_id: transactionIntentId,
          entry_type: LedgerEntryType.Credit,
          amount: amountValue,
          balance_before: receiverBefore.toFixed(2),
          balance_after: receiverAfter.toFixed(2),
        },
      ]);

      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: createTransferDto.sender_wallet_id })
        .update({
          available_balance: senderAfter.toFixed(2),
        });
      await trx
        .table(BALANCES_TABLE)
        .where({ wallet_id: createTransferDto.receiver_wallet_id })
        .update({
          available_balance: receiverAfter.toFixed(2),
        });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.LedgerEntry,
          entity_id: debitEntryId,
          action: AuditAction.CreateLedgerEntry,
          metadata: {
            wallet_id: createTransferDto.sender_wallet_id,
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
            wallet_id: createTransferDto.receiver_wallet_id,
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
          entity_id: senderBalance.id,
          action: AuditAction.UpdateBalance,
          metadata: {
            wallet_id: createTransferDto.sender_wallet_id,
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
            wallet_id: createTransferDto.receiver_wallet_id,
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
      await trx.table(TRANSFERS_TABLE).where({ id: transferId }).update({
        status: TransferStatus.Success,
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
        transfer_id: transferId,
        transaction_intent_id: transactionIntentId,
        sender_wallet_id: createTransferDto.sender_wallet_id,
        receiver_wallet_id: createTransferDto.receiver_wallet_id,
        amount: amountValue,
        status: TransferStatus.Success,
        reference,
      };
    });

    return response;
  }

  async history(query: TransferHistoryQueryDto) {
    const dataQuery = this.knex
      .getDb()
      .table(TRANSFERS_TABLE)
      .select([
        'id',
        'sender_wallet_id',
        'receiver_wallet_id',
        'amount',
        'status',
        'reference',
        'transaction_intent_id',
        'created_at',
        'updated_at',
      ]);

    if (query.status) {
      dataQuery.where('status', query.status);
    }
    if (query.sender_wallet_id) {
      dataQuery.where('sender_wallet_id', query.sender_wallet_id);
    }
    if (query.receiver_wallet_id) {
      dataQuery.where('receiver_wallet_id', query.receiver_wallet_id);
    }
    if (query.reference) {
      dataQuery.where('reference', query.reference);
    }

    return dataQuery.orderBy('created_at', 'desc');
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
