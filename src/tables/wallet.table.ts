import { Knex } from 'knex';
import { WALLETS_TABLE } from 'src/common/constants/table-names.constants';

export enum WalletStatus {
  Active = 'active',
  Locked = 'locked',
}

export interface BankDetails {
  bank_account_number: string;
  bank_code: string;
}

export type WalletRow = {
  id: string;
  user_id: string;
  currency: string;
  account_details: BankDetails;
  status: WalletStatus;
  created_at: Date;
  updated_at: Date;
};

export type WalletInsert = Omit<WalletRow, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type WalletUpdate = Partial<
  Omit<WalletRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildWalletsTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(WALLETS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('user_id', 50)
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('currency').notNullable();
    table.json('account_details').notNullable();
    table
      .enum('status', Object.values(WalletStatus))
      .notNullable()
      .defaultTo(WalletStatus.Active);
    table.timestamps(true, true);
  });
