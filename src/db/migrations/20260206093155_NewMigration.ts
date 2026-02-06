import type { Knex } from 'knex';
import {
  BALANCES_TABLE,
  BLACKLISTS_TABLE,
  FUNDINGS_TABLE,
  IDEMPOTENCY_KEYS_TABLE,
  LEDGER_ENTRIES_TABLE,
  TRANSACTION_INTENTS_TABLE,
  TRANSFERS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
  WITHDRAWALS_TABLE,
} from 'src/common/constants/table-names.constants';
import { buildBalancesTable } from 'src/res/balances/tables/balance.table';
import { buildBlacklistsTable } from 'src/res/blacklist/tables/blacklist.table';
import { buildFundingsTable } from 'src/res/funding/tables/funding.table';
import { buildIdempotencyKeysTable } from 'src/res/idempotency-keys/tables/idempotency_key.table';
import { buildLedgerEntriesTable } from 'src/res/ledger-entries/tables/ledger_entry.table';
import { buildTransactionIntentsTable } from 'src/res/transactions/tables/transaction.table';
import { buildTransfersTable } from 'src/res/transfers/tables/transfer.table';
import { buildUsersTable } from 'src/res/users/tables/user.table';
import { buildWalletsTable } from 'src/res/wallets/tables/wallet.table';
import { buildWithdrawalsTable } from 'src/res/withdrawals/tables/withdrawal.table';

// The tables are created in the order of the up function
// to ensure that the foreign key constraints are not violated
export async function up(knex: Knex): Promise<void> {
  await buildUsersTable(knex);
  await buildWalletsTable(knex);
  await buildBalancesTable(knex);
  await buildTransactionIntentsTable(knex);
  await buildLedgerEntriesTable(knex);
  await buildTransfersTable(knex);
  await buildFundingsTable(knex);
  await buildWithdrawalsTable(knex);
  await buildIdempotencyKeysTable(knex);
  await buildBlacklistsTable(knex);
}

// The tables are dropped in the opposite direction of the up function
// to ensure that the foreign key constraints are not violated
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(BLACKLISTS_TABLE);
  await knex.schema.dropTableIfExists(IDEMPOTENCY_KEYS_TABLE);
  await knex.schema.dropTableIfExists(WITHDRAWALS_TABLE);
  await knex.schema.dropTableIfExists(FUNDINGS_TABLE);
  await knex.schema.dropTableIfExists(TRANSFERS_TABLE);
  await knex.schema.dropTableIfExists(LEDGER_ENTRIES_TABLE);
  await knex.schema.dropTableIfExists(TRANSACTION_INTENTS_TABLE);
  await knex.schema.dropTableIfExists(BALANCES_TABLE);
  await knex.schema.dropTableIfExists(WALLETS_TABLE);
  await knex.schema.dropTableIfExists(USERS_TABLE);
}
