import { Knex } from 'knex';
import { TRANSFERS_TABLE } from 'src/common/constants/table-names.constants';

export enum TransferStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export type TransferRow = {
  id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  amount: string;
  status: TransferStatus;
  reference: string;
  transaction_intent_id: string;
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

export const buildTransfersTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(TRANSFERS_TABLE, (table) => {
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
      .string('transaction_intent_id', 50)
      .notNullable()
      .references('id')
      .inTable('transaction_intents')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });
