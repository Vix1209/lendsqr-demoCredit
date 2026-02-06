import { Knex } from 'knex';

export enum WithdrawalStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export const WITHDRAWALS_TABLE = 'withdrawals';

export type WithdrawalRow = {
  id: string;
  wallet_id: string;
  amount: string;
  status: WithdrawalStatus;
  reference: string;
  destination: string;
  transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type WithdrawalInsert = Omit<
  WithdrawalRow,
  'created_at' | 'updated_at'
> & {
  created_at?: Date;
  updated_at?: Date;
};

export type WithdrawalUpdate = Partial<
  Omit<WithdrawalRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildWithdrawalsTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(WITHDRAWALS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.decimal('amount', 18, 2).notNullable();
    table
      .enum('status', Object.values(WithdrawalStatus))
      .notNullable()
      .defaultTo(WithdrawalStatus.Pending);
    table.string('reference').notNullable();
    table.string('destination').notNullable();
    table
      .string('transaction_id', 50)
      .nullable()
      .references('id')
      .inTable('transactions')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });
