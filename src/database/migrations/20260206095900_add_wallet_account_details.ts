import type { Knex } from 'knex';
import { WALLETS_TABLE } from 'src/common/constants/table-names.constants';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    WALLETS_TABLE,
    'account_details',
  );
  if (hasColumn) {
    return;
  }

  await knex.schema.alterTable(WALLETS_TABLE, (table) => {
    table.json('account_details').nullable();
  });

  await knex(WALLETS_TABLE)
    .whereNull('account_details')
    .update({
      account_details: JSON.stringify({
        bank_account_number: '',
        bank_code: '',
      }),
    });

  await knex.schema.alterTable(WALLETS_TABLE, (table) => {
    table.json('account_details').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(
    WALLETS_TABLE,
    'account_details',
  );
  if (!hasColumn) {
    return;
  }

  await knex.schema.alterTable(WALLETS_TABLE, (table) => {
    table.dropColumn('account_details');
  });
}
