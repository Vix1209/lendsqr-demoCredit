import { Knex } from 'knex';

export enum TransferStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export const TRANSFERS_TABLE = 'transfers';

export type TransferRow = {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  amount: string;
  status: TransferStatus;
  reference: string;
  transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type TransferInsert = Omit<TransferRow, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type TransferUpdate = Partial<
  Omit<TransferRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildTransfersTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(TRANSFERS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('sender_wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .string('receiver_wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.decimal('amount', 18, 2).notNullable();
    table
      .enum('status', Object.values(TransferStatus))
      .notNullable()
      .defaultTo(TransferStatus.Pending);
    table.string('reference').notNullable();
    table
      .string('transaction_id', 50)
      .nullable()
      .references('id')
      .inTable('transactions')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });
