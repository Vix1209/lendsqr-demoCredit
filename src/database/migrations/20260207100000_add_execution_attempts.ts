import type { Knex } from 'knex';
import { EXECUTION_ATTEMPTS_TABLE } from 'src/common/constants/table-names.constants';
import { buildExecutionAttemptsTable } from 'src/tables/execution_attempt.table';

export async function up(knex: Knex): Promise<void> {
  await buildExecutionAttemptsTable(knex);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(EXECUTION_ATTEMPTS_TABLE);
}
