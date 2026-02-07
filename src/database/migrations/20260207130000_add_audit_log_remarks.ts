import type { Knex } from 'knex';
import { AUDIT_LOGS_TABLE } from 'src/common/constants/table-names.constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUDIT_LOGS_TABLE, (table) => {
    table.string('remark', 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUDIT_LOGS_TABLE, (table) => {
    table.dropColumn('remark');
  });
}
