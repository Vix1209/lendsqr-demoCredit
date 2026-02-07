import { Knex } from 'knex';
import { EXECUTION_ATTEMPTS_TABLE } from 'src/common/constants/table-names.constants';

export enum ExecutionStatus {
  STARTED = 'STARTED',
  RETRYING = 'RETRYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export type ExecutionAttemptRow = {
  id: string;
  transaction_intent_id: string;
  status: ExecutionStatus;
  attempt_number: number;
  provider: string;
  provider_reference: string | null;
  response_payload: Record<string, unknown> | null;
  attempted_at: Date;
};

export type ExecutionAttemptInsert = Omit<
  ExecutionAttemptRow,
  'attempted_at'
> & {
  attempted_at?: Date;
};

export const buildExecutionAttemptsTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(EXECUTION_ATTEMPTS_TABLE, (table) => {
    table.string('id', 50).primary();
    table
      .string('transaction_intent_id', 50)
      .notNullable()
      .references('id')
      .inTable('transaction_intents')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.enum('status', Object.values(ExecutionStatus)).notNullable();
    table.integer('attempt_number').notNullable();
    table.string('provider').notNullable();
    table.string('provider_reference').nullable();
    table.json('response_payload').nullable();
    table
      .timestamp('attempted_at', { useTz: true })
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });
