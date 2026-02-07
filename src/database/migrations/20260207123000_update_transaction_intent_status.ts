import type { Knex } from 'knex';
import { TRANSACTION_INTENTS_TABLE } from 'src/common/constants/table-names.constants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(
    `ALTER TABLE \`${TRANSACTION_INTENTS_TABLE}\` MODIFY COLUMN \`status\` ENUM('pending','created','processing','settled','failed') NOT NULL DEFAULT 'pending'`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(
    `ALTER TABLE \`${TRANSACTION_INTENTS_TABLE}\` MODIFY COLUMN \`status\` ENUM('created','processing','settled','failed') NOT NULL DEFAULT 'created'`,
  );
}
