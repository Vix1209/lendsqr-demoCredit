import { NestExpressApplication } from '@nestjs/platform-express';
import {
  BALANCES_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from '../constants/table-names.constants';
import { SEED_USERS } from '../constants/seed.constants';
import { generateId } from './customId.utils';
import { DatabaseService } from 'src/database/knex.service';
import { UserStatus } from 'src/tables/user.table';
import { WalletStatus } from 'src/tables/wallet.table';

export async function seedDefaultUser(app: NestExpressApplication) {
  const knex = app.get(DatabaseService);
  await knex.getDb().transaction(async (trx) => {
    for (const seedUser of SEED_USERS) {
      const existingUser = await trx
        .table(USERS_TABLE)
        .where({ email: seedUser.email })
        .first();
      if (existingUser) {
        continue;
      }

      const userId = generateId('USER');
      const walletId = generateId('WAL');
      const balanceId = generateId('BAL');

      await trx.table(USERS_TABLE).insert({
        id: userId,
        email: seedUser.email,
        first_name: seedUser.first_name,
        last_name: seedUser.last_name,
        phone_number: seedUser.phone_number,
        status: UserStatus.Active,
      });

      await trx.table(WALLETS_TABLE).insert({
        id: walletId,
        user_id: userId,
        currency: seedUser.currency,
        account_details: seedUser.account_details,
        status: WalletStatus.Active,
      });

      await trx.table(BALANCES_TABLE).insert({
        id: balanceId,
        wallet_id: walletId,
        available_balance: '0.00',
        pending_balance: '0.00',
      });
    }
  });
}
