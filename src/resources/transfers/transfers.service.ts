import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/knex.service';
import {
  TRANSACTION_INTENTS_TABLE,
  TRANSFERS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_TRANSACTION_INTENT,
  ID_PREFIX_TRANSFER,
  ID_PREFIX_TRANSFER_REFERENCE,
} from 'src/common/constants/id-prefix.constants';
import {
  TransactionIntentDirection,
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
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
        status: TransactionIntentStatus.Pending,
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

      await trx.table(TRANSFERS_TABLE).insert({
        id: transferId,
        sender_wallet_id: createTransferDto.sender_wallet_id,
        receiver_wallet_id: createTransferDto.receiver_wallet_id,
        amount: amountValue,
        status: TransferStatus.Pending,
        reference,
        transaction_intent_id: transactionIntentId,
      });
      return {
        transfer_id: transferId,
        transaction_intent_id: transactionIntentId,
        sender_wallet_id: createTransferDto.sender_wallet_id,
        receiver_wallet_id: createTransferDto.receiver_wallet_id,
        amount: amountValue,
        status: TransferStatus.Pending,
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
}
