import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/knex.module';
import { UsersModule } from './res/users/users.module';
// import { WalletsModule } from './res/wallets/wallets.module';
// import { TransactionsModule } from './res/transactions/transactions.module';
// import { TransfersModule } from './res/transfers/transfers.module';
// import { BlacklistModule } from './res/blacklist/blacklist.module';
// import { FundingModule } from './res/funding/funding.module';
// import { WithdrawalsModule } from './res/withdrawals/withdrawals.module';
// import { BalancesModule } from './res/balances/balances.module';
// import { IdempotencyKeysModule } from './res/idempotency-keys/idempotency-keys.module';
// import { LedgerEntriesModule } from './res/ledger-entries/ledger-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    DatabaseModule,
    UsersModule,
    // WalletsModule,
    // TransactionsModule,
    // TransfersModule,
    // BlacklistModule,
    // FundingModule,
    // WithdrawalsModule,
    // BalancesModule,
    // IdempotencyKeysModule,
    // LedgerEntriesModule,
  ],
})
export class AppModule {}
