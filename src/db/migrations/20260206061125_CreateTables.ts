import type { Knex } from 'knex';
import {
  BLACKLISTS_TABLE,
  buildBlacklistsTable,
} from 'src/res/blacklist/entities/blacklist.entity';
import {
  buildFundingsTable,
  FUNDINGS_TABLE,
} from 'src/res/funding/entities/funding.entity';
import {
  buildTransactionsTable,
  TRANSACTIONS_TABLE,
} from 'src/res/transactions/entities/transaction.entity';
import {
  buildTransfersTable,
  TRANSFERS_TABLE,
} from 'src/res/transfers/entities/transfer.entity';
import {
  buildUsersTable,
  USERS_TABLE,
} from 'src/res/users/entities/user.entity';
import {
  buildWalletsTable,
  WALLETS_TABLE,
} from 'src/res/wallets/entities/wallet.entity';
import {
  buildWithdrawalsTable,
  WITHDRAWALS_TABLE,
} from 'src/res/withdrawals/entities/withdrawal.entity';

// The tables are created in the order of the up function
// to ensure that the foreign key constraints are not violated
export async function up(knex: Knex): Promise<void> {
  await buildUsersTable(knex.schema);
  await buildWalletsTable(knex.schema);
  await buildTransactionsTable(knex.schema);
  await buildTransfersTable(knex.schema);
  await buildFundingsTable(knex.schema);
  await buildWithdrawalsTable(knex.schema);
  await buildBlacklistsTable(knex.schema);
}

// The tables are dropped in the opposite direction of the up function
// to ensure that the foreign key constraints are not violated
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(BLACKLISTS_TABLE);
  await knex.schema.dropTableIfExists(WITHDRAWALS_TABLE);
  await knex.schema.dropTableIfExists(FUNDINGS_TABLE);
  await knex.schema.dropTableIfExists(TRANSFERS_TABLE);
  await knex.schema.dropTableIfExists(TRANSACTIONS_TABLE);
  await knex.schema.dropTableIfExists(WALLETS_TABLE);
  await knex.schema.dropTableIfExists(USERS_TABLE);
}
