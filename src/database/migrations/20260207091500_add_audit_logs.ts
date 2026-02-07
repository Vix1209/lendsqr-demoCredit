import type { Knex } from 'knex';
import { AUDIT_LOGS_TABLE } from 'src/common/constants/table-names.constants';
import { buildAuditLogsTable } from 'src/tables/audit_log.table';

export async function up(knex: Knex): Promise<void> {
  await buildAuditLogsTable(knex);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(AUDIT_LOGS_TABLE);
}
