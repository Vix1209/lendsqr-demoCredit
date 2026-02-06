import { Knex } from 'knex';

export enum FundingStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export const FUNDINGS_TABLE = 'fundings';

export type FundingRow = {
  id: string;
  wallet_id: string;
  amount: string;
  status: FundingStatus;
  reference: string;
  provider: string;
  transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type FundingInsert = Omit<FundingRow, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type FundingUpdate = Partial<
  Omit<FundingRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildFundingsTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(FUNDINGS_TABLE, (table) => {
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
      .enum('status', Object.values(FundingStatus))
      .notNullable()
      .defaultTo(FundingStatus.Pending);
    table.string('reference').notNullable();
    table.string('provider').notNullable();
    table
      .string('transaction_id', 50)
      .nullable()
      .references('id')
      .inTable('transactions')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });
