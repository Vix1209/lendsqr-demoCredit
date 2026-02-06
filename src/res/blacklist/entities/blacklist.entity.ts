import { Knex } from 'knex';

export enum BlacklistStatus {
  Clear = 'clear',
  Blacklisted = 'blacklisted',
  Error = 'error',
}

export const BLACKLISTS_TABLE = 'blacklist_checks';

export type BlacklistRow = {
  id: string;
  user_id: string;
  provider: string;
  status: BlacklistStatus;
  response_payload: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type BlacklistInsert = Omit<
  BlacklistRow,
  'created_at' | 'updated_at'
> & {
  created_at?: Date;
  updated_at?: Date;
};

export type BlacklistUpdate = Partial<
  Omit<BlacklistRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildBlacklistsTable = (
  schema: Knex.SchemaBuilder,
): Knex.SchemaBuilder =>
  schema.createTable(BLACKLISTS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('user_id', 50)
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('provider').notNullable();
    table
      .enum('status', Object.values(BlacklistStatus))
      .notNullable()
      .defaultTo(BlacklistStatus.Clear);
    table.json('response_payload').nullable();
    table.timestamps(true, true);
  });
