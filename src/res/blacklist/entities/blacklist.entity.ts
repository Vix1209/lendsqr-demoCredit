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
};

export type BlacklistInsert = Omit<BlacklistRow, 'created_at'> & {
  created_at?: Date;
};

export const buildBlacklistsTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(BLACKLISTS_TABLE, (table) => {
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
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });
