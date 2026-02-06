import { Knex } from 'knex';

export enum TransactionIntentType {
  Funding = 'funding',
  Transfer = 'transfer',
  Withdrawal = 'withdrawal',
  Repayment = 'repayment',
}

export enum TransactionIntentDirection {
  Credit = 'credit',
  Debit = 'debit',
  Internal = 'internal',
}

export enum TransactionIntentStatus {
  Created = 'created',
  Processing = 'processing',
  Settled = 'settled',
  Failed = 'failed',
}

export const TRANSACTION_INTENTS_TABLE = 'transaction_intents';

export type TransactionIntentRow = {
  id: string;
  wallet_id: string;
  type: TransactionIntentType;
  direction: TransactionIntentDirection;
  amount: string;
  status: TransactionIntentStatus;
  reference: string;
  idempotency_key: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type TransactionIntentInsert = Omit<
  TransactionIntentRow,
  'created_at' | 'updated_at'
> & {
  created_at?: Date;
  updated_at?: Date;
};

export type TransactionIntentUpdate = Partial<
  Omit<TransactionIntentRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildTransactionIntentsTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(TRANSACTION_INTENTS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.enum('type', Object.values(TransactionIntentType)).notNullable();
    table
      .enum('direction', Object.values(TransactionIntentDirection))
      .notNullable();
    table.decimal('amount', 18, 2).notNullable();
    table
      .enum('status', Object.values(TransactionIntentStatus))
      .notNullable()
      .defaultTo(TransactionIntentStatus.Created);
    table.string('reference').notNullable();
    table.string('idempotency_key').notNullable();
    table.json('metadata').nullable();
    table.timestamps(true, true);
    table.unique(['reference']);
    table.unique(['idempotency_key']);
  });
