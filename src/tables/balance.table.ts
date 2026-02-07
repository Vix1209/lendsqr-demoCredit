import { Knex } from 'knex';
import { BALANCES_TABLE } from 'src/common/constants/table-names.constants';

export type BalanceRow = {
  id: string;
  wallet_id: string;
  available_balance: string;
  pending_balance: string;
  created_at: Date;
  updated_at: Date;
};

export type BalanceInsert = Omit<BalanceRow, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type BalanceUpdate = Partial<
  Omit<BalanceRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildBalancesTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(BALANCES_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.decimal('available_balance', 18, 2).notNullable().defaultTo(0);
    table.decimal('pending_balance', 18, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
