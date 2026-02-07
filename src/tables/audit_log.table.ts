import { Knex } from 'knex';
import { AUDIT_LOGS_TABLE } from 'src/common/constants/table-names.constants';

export enum AuditActorType {
  System = 'system',
  User = 'user',
  Admin = 'admin',
  Service = 'service',
}

export enum EntityType {
  TransactionIntent = 'transaction_intent',
  LedgerEntry = 'ledger_entry',
  Balance = 'balance',
}

export enum AuditAction {
  CreateIntent = 'create_intent',
  SettleTxn = 'settle_txn',
  TxnFailed = 'txn_failed',
  CreateLedgerEntry = 'create_ledger_entry',
  UpdateBalance = 'update_balance',
}

export type AuditLogRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  actor_type: AuditActorType;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  remark: string | null;
  created_at: Date;
};

export type AuditLogInsert = Omit<AuditLogRow, 'created_at'> & {
  created_at?: Date;
};

export const buildAuditLogsTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(AUDIT_LOGS_TABLE, (table) => {
    table.string('id', 50).primary();
    table.enum('entity_type', Object.values(EntityType)).notNullable();
    table.string('entity_id', 100).notNullable();
    table.enum('action', Object.values(AuditAction)).notNullable();
    table.enum('actor_type', Object.values(AuditActorType)).notNullable();
    table.string('actor_id', 100).nullable();
    table.json('metadata').nullable();
    table.string('remark', 500).nullable();
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.index(['entity_type', 'entity_id']);
  });
