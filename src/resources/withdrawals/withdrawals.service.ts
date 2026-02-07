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
import {
  CreateWithdrawalDto,
  WithdrawalHistoryQueryDto,
} from './dto/create-withdrawal.dto';
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

    const wallet = await this.assertWalletAllowed(
      createWithdrawalDto.wallet_id,
    );
    const destinationDetails =
      createWithdrawalDto.destination ??
      this.resolveDestinationDetailsFromWallet(wallet.account_details);
    if (!destinationDetails) {
      throw new BadRequestException('Destination is required');
    }
    const destinationReference =
      this.formatDestinationReference(destinationDetails);

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
        metadata: { destination: destinationDetails },
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
            destination: destinationDetails,
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
        destination: destinationReference,
        transaction_intent_id: transactionIntentId,
      });
      return {
        withdrawal_id: withdrawalId,
        transaction_intent_id: transactionIntentId,
        wallet_id: createWithdrawalDto.wallet_id,
        amount: amountValue,
        status: WithdrawalStatus.Pending,
        reference,
        destination: destinationDetails,
      };
    });

    return response;
  }

  async history(query: WithdrawalHistoryQueryDto) {
    const dataQuery = this.knex
      .getDb()
      .table(WITHDRAWALS_TABLE)
      .select([
        'id',
        'wallet_id',
        'amount',
        'status',
        'reference',
        'destination',
        'transaction_intent_id',
        'created_at',
        'updated_at',
      ]);

    if (query.status) {
      dataQuery.where('status', query.status);
    }
    if (query.wallet_id) {
      dataQuery.where('wallet_id', query.wallet_id);
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

  private resolveDestinationDetailsFromWallet(
    accountDetails: {
      bank_account_number?: string;
      bank_code?: string;
    } | null,
  ) {
    if (!accountDetails) return null;
    const accountNumber = accountDetails.bank_account_number?.trim();
    const bankCode = accountDetails.bank_code?.trim();
    if (!accountNumber || !bankCode) return null;
    return {
      bank_account_number: accountNumber,
      bank_code: bankCode,
    };
  }

  private formatDestinationReference(destination: {
    bank_account_number: string;
    bank_code: string;
  }) {
    return `bank:${destination.bank_code}:${destination.bank_account_number}`;
  }
}
