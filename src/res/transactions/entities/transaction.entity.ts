import { Knex } from 'knex';

export enum TransactionType {
  Funding = 'funding',
  Transfer = 'transfer',
  Withdrawal = 'withdrawal',
}

export enum TransactionDirection {
  Credit = 'credit',
  Debit = 'debit',
}

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export const TRANSACTIONS_TABLE = 'transactions';

export type TransactionRow = {
  id: string;
  wallet_id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: string;
  status: TransactionStatus;
  reference: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type TransactionInsert = Omit<
  TransactionRow,
  'created_at' | 'updated_at'
> & {
  created_at?: Date;
  updated_at?: Date;
};

export type TransactionUpdate = Partial<
  Omit<TransactionRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildTransactionsTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(TRANSACTIONS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.enum('type', Object.values(TransactionType)).notNullable();
    table.enum('direction', Object.values(TransactionDirection)).notNullable();
    table.decimal('amount', 18, 2).notNullable();
    table
      .enum('status', Object.values(TransactionStatus))
      .notNullable()
      .defaultTo(TransactionStatus.Pending);
    table.string('reference').notNullable();
    table.json('metadata').nullable();
    table.timestamps(true, true);
  });
