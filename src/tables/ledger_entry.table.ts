import { Knex } from 'knex';
import { LEDGER_ENTRIES_TABLE } from 'src/common/constants/table-names.constants';

export enum LedgerEntryType {
  Debit = 'debit',
  Credit = 'credit',
}

export type LedgerEntryRow = {
  id: string;
  wallet_id: string;
  transaction_intent_id: string;
  entry_type: LedgerEntryType;
  amount: string;
  balance_before: string;
  balance_after: string;
  created_at: Date;
};

export type LedgerEntryInsert = Omit<LedgerEntryRow, 'created_at'> & {
  created_at?: Date;
};

export const buildLedgerEntriesTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(LEDGER_ENTRIES_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('wallet_id', 50)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .string('transaction_intent_id', 50)
      .notNullable()
      .references('id')
      .inTable('transaction_intents')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.enum('entry_type', Object.values(LedgerEntryType)).notNullable();
    table.decimal('amount', 18, 2).notNullable();
    table.decimal('balance_before', 18, 2).notNullable();
    table.decimal('balance_after', 18, 2).notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });
