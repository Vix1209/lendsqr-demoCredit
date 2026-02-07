import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/knex.module';
import { UsersModule } from './resources/users/users.module';
import { TransfersModule } from './resources/transfers/transfers.module';
import { BlacklistModule } from './resources/blacklist/blacklist.module';
import { FundingModule } from './resources/funding/funding.module';
import { WithdrawalsModule } from './resources/withdrawals/withdrawals.module';
import { BalancesModule } from './resources/balances/balances.module';
import { IdempotencyKeysModule } from './resources/idempotency-keys/idempotency-keys.module';
import { AuditLogsModule } from './resources/audit-logs/audit-logs.module';
import { TransactionModule } from './resources/transaction/transaction.module';
import { LedgerEntriesModule } from './resources/ledger-entries/ledger-entries.module';
import { ExecutionAttemptsModule } from './resources/execution-attempts/execution-attempts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    DatabaseModule,
    UsersModule,
    BalancesModule,
    IdempotencyKeysModule,
    TransactionModule,
    FundingModule,
    TransfersModule,
    WithdrawalsModule,
    BlacklistModule,
    AuditLogsModule,
    LedgerEntriesModule,
    ExecutionAttemptsModule,
  ],
})
export class AppModule {}
