import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/knex.service';
import {
  TRANSACTION_INTENTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
  WITHDRAWALS_TABLE,
} from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_TRANSACTION_INTENT,
  ID_PREFIX_WITHDRAWAL,
  ID_PREFIX_WITHDRAWAL_REFERENCE,
} from 'src/common/constants/id-prefix.constants';
import { AuditAction, EntityType } from 'src/tables/audit_log.table';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import {
  TransactionIntentDirection,
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
import { UserStatus } from 'src/tables/user.table';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalStatus } from '../../tables/withdrawal.table';

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly knex: DatabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createWithdrawalDto: CreateWithdrawalDto) {
    const amount = Number.parseFloat(createWithdrawalDto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    await this.assertWalletAllowed(createWithdrawalDto.wallet_id);

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
        status: TransactionIntentStatus.Pending,
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

      await trx.table(WITHDRAWALS_TABLE).insert({
        id: withdrawalId,
        wallet_id: createWithdrawalDto.wallet_id,
        amount: amountValue,
        status: WithdrawalStatus.Pending,
        reference,
        destination: createWithdrawalDto.destination,
        transaction_intent_id: transactionIntentId,
      });
      return {
        withdrawal_id: withdrawalId,
        transaction_intent_id: transactionIntentId,
        wallet_id: createWithdrawalDto.wallet_id,
        amount: amountValue,
        status: WithdrawalStatus.Pending,
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
}
