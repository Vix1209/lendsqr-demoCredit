import { Knex } from 'knex';
import { IDEMPOTENCY_KEYS_TABLE } from 'src/common/constants/table-names.constants';

export enum IdempotencyStatus {
  Processing = 'processing',
  Success = 'success',
  Failed = 'failed',
}

export type IdempotencyKeyRow = {
  id: string;
  idempotency_key: string;
  request_hash: string;
  response_payload: Record<string, unknown> | null;
  status: IdempotencyStatus;
  created_at: Date;
  updated_at: Date;
};

export type IdempotencyKeyInsert = Omit<
  IdempotencyKeyRow,
  'created_at' | 'updated_at'
> & {
  created_at?: Date;
  updated_at?: Date;
};

export type IdempotencyKeyUpdate = Partial<
  Omit<IdempotencyKeyRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildIdempotencyKeysTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(IDEMPOTENCY_KEYS_TABLE, (table) => {
    table.string('id', 50).primary();
    table.string('idempotency_key').notNullable().unique();
    table.string('request_hash').notNullable();
    table.json('response_payload').nullable();
    table
      .enum('status', Object.values(IdempotencyStatus))
      .notNullable()
      .defaultTo(IdempotencyStatus.Processing);
    table.timestamps(true, true);
  });
