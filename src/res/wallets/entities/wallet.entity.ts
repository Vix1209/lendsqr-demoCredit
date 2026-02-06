import { Knex } from 'knex';

export enum WalletStatus {
  Active = 'active',
  Locked = 'locked',
}

export const WALLETS_TABLE = 'wallets';

export type WalletRow = {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
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

export const buildWalletsTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(WALLETS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('user_id', 50)
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.decimal('balance', 18, 2).notNullable().defaultTo(0);
    table.string('currency').notNullable();
    table
      .enum('status', Object.values(WalletStatus))
      .notNullable()
      .defaultTo(WalletStatus.Active);
    table.timestamps(true, true);
  });
