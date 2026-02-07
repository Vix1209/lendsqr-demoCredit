import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/knex.service';
import {
  FUNDINGS_TABLE,
  TRANSACTION_INTENTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_FUNDING,
  ID_PREFIX_FUNDING_REFERENCE,
  ID_PREFIX_TRANSACTION_INTENT,
} from 'src/common/constants/id-prefix.constants';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { AuditAction, EntityType } from 'src/tables/audit_log.table';
import {
  TransactionIntentDirection,
  TransactionIntentStatus,
  TransactionIntentType,
} from 'src/tables/transaction.table';
import { FundingStatus } from '../../tables/funding.table';
import { UserStatus } from 'src/tables/user.table';
import { CreateFundingDto } from './dto/create-funding.dto';

@Injectable()
export class FundingService {
  constructor(
    private readonly knex: DatabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createFundingDto: CreateFundingDto) {
    const amount = Number.parseFloat(createFundingDto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.knex.findOne(WALLETS_TABLE, {
      id: createFundingDto.wallet_id,
    });
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

    const reference = generateId(ID_PREFIX_FUNDING_REFERENCE);
    const transactionIntentId = generateId(ID_PREFIX_TRANSACTION_INTENT);
    const fundingId = generateId(ID_PREFIX_FUNDING);
    const amountValue = amount.toFixed(2);
    const provider = createFundingDto.provider;

    const response = await this.knex.getDb().transaction(async (trx) => {
      await trx.table(TRANSACTION_INTENTS_TABLE).insert({
        id: transactionIntentId,
        wallet_id: createFundingDto.wallet_id,
        type: TransactionIntentType.Funding,
        direction: TransactionIntentDirection.Credit,
        amount: amountValue,
        status: TransactionIntentStatus.Pending,
        reference,
        idempotency_key: createFundingDto.idempotency_key,
        metadata: { provider },
      });

      await this.auditLogsService.createLog(
        this.auditLogsService.buildSystemLog({
          entity_type: EntityType.TransactionIntent,
          entity_id: transactionIntentId,
          action: AuditAction.CreateIntent,
          metadata: {
            amount: amountValue,
            reference,
            wallet_id: createFundingDto.wallet_id,
          },
        }),
        trx,
      );

      await trx.table(FUNDINGS_TABLE).insert({
        id: fundingId,
        wallet_id: createFundingDto.wallet_id,
        amount: amountValue,
        status: FundingStatus.Pending,
        reference,
        provider,
        transaction_intent_id: transactionIntentId,
      });

      return {
        funding_id: fundingId,
        transaction_intent_id: transactionIntentId,
        wallet_id: createFundingDto.wallet_id,
        amount: amountValue,
        status: FundingStatus.Pending,
        reference,
        provider,
      };
    });

    return response;
  }
}
