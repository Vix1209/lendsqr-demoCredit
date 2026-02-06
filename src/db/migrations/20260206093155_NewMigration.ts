import type { Knex } from 'knex';
import {
  BALANCES_TABLE,
  buildBalancesTable,
} from 'src/res/balances/entities/balance.entity';
import {
  BLACKLISTS_TABLE,
  buildBlacklistsTable,
} from 'src/res/blacklist/entities/blacklist.entity';
import {
  buildFundingsTable,
  FUNDINGS_TABLE,
} from 'src/res/funding/entities/funding.entity';
import {
  buildIdempotencyKeysTable,
  IDEMPOTENCY_KEYS_TABLE,
} from 'src/res/idempotency-keys/entities/idempotency_key.entity';
import {
  buildLedgerEntriesTable,
  LEDGER_ENTRIES_TABLE,
} from 'src/res/ledger-entries/entities/ledger_entry.entity';
import {
  buildTransactionIntentsTable,
  TRANSACTION_INTENTS_TABLE,
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
