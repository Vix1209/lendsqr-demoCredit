import type { Knex } from 'knex';
import {
  AUDIT_LOGS_TABLE,
  BALANCES_TABLE,
  BLACKLISTS_TABLE,
  EXECUTION_ATTEMPTS_TABLE,
  FUNDINGS_TABLE,
  IDEMPOTENCY_KEYS_TABLE,
  LEDGER_ENTRIES_TABLE,
  TRANSACTION_INTENTS_TABLE,
  TRANSFERS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
  WITHDRAWALS_TABLE,
} from 'src/common/constants/table-names.constants';
import { buildAuditLogsTable } from 'src/tables/audit_log.table';
import { buildBalancesTable } from 'src/tables/balance.table';
import { buildBlacklistsTable } from 'src/tables/blacklist.table';
import { buildExecutionAttemptsTable } from 'src/tables/execution_attempt.table';
import { buildFundingsTable } from 'src/tables/funding.table';
import { buildIdempotencyKeysTable } from 'src/tables/idempotency_key.table';
import { buildLedgerEntriesTable } from 'src/tables/ledger_entry.table';
import { buildTransactionIntentsTable } from 'src/tables/transaction.table';
import { buildTransfersTable } from 'src/tables/transfer.table';
import { buildUsersTable } from 'src/tables/user.table';
import { buildWalletsTable } from 'src/tables/wallet.table';
import { buildWithdrawalsTable } from 'src/tables/withdrawal.table';

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
  await buildExecutionAttemptsTable(knex);
  await buildIdempotencyKeysTable(knex);
  await buildBlacklistsTable(knex);
  await buildAuditLogsTable(knex);
}

// The tables are dropped in the opposite direction of the up function
// to ensure that the foreign key constraints are not violated
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(AUDIT_LOGS_TABLE);
  await knex.schema.dropTableIfExists(BLACKLISTS_TABLE);
  await knex.schema.dropTableIfExists(IDEMPOTENCY_KEYS_TABLE);
  await knex.schema.dropTableIfExists(EXECUTION_ATTEMPTS_TABLE);
  await knex.schema.dropTableIfExists(WITHDRAWALS_TABLE);
  await knex.schema.dropTableIfExists(FUNDINGS_TABLE);
  await knex.schema.dropTableIfExists(TRANSFERS_TABLE);
  await knex.schema.dropTableIfExists(LEDGER_ENTRIES_TABLE);
  await knex.schema.dropTableIfExists(TRANSACTION_INTENTS_TABLE);
  await knex.schema.dropTableIfExists(BALANCES_TABLE);
  await knex.schema.dropTableIfExists(WALLETS_TABLE);
  await knex.schema.dropTableIfExists(USERS_TABLE);
}
