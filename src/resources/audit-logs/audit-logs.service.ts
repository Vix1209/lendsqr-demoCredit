import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AUDIT_LOGS_TABLE } from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import { ID_PREFIX_AUDIT } from 'src/common/constants/id-prefix.constants';
import { DatabaseService } from 'src/database/knex.service';
import {
  AuditAction,
  AuditActorType,
  AuditLogRow,
  AuditLogInsert,
  EntityType,
} from '../../tables/audit_log.table';

@Injectable()
export class AuditLogsService {
  constructor(private readonly knex: DatabaseService) {}

  async list(input: {
    entity_type?: EntityType;
    entity_id?: string;
    action?: AuditAction;
    actor_type?: AuditActorType;
    actor_id?: string;

    limit: number;
    offset: number;
  }) {
    const query = this.knex.getDb().table(AUDIT_LOGS_TABLE);

    if (input.entity_type) {
      query.where('entity_type', input.entity_type);
    }
    if (input.entity_id) {
      query.where('entity_id', input.entity_id);
    }
    if (input.action) {
      query.where('action', input.action);
    }
    if (input.actor_type) {
      query.where('actor_type', input.actor_type);
    }
    if (input.actor_id) {
      query.where('actor_id', input.actor_id);
    }

    return query
      .orderBy('created_at', 'desc')
      .limit(input.limit)
      .offset(input.offset);
  }

  async getById(id: string): Promise<AuditLogRow | null> {
    return this.knex.findOne(AUDIT_LOGS_TABLE, { id });
  }

  async createLog(input: Omit<AuditLogInsert, 'id'>, trx?: Knex.Transaction) {
    const data: AuditLogInsert = {
      id: generateId(ID_PREFIX_AUDIT),
      ...input,
      remark: input.remark ?? this.buildRemarkFromInput(input),
    };

    if (trx) {
      await trx.table(AUDIT_LOGS_TABLE).insert(data);
      return data;
    }

    await this.knex.insert(AUDIT_LOGS_TABLE, data);
    return data;
  }

  buildSystemLog(input: {
    entity_type: EntityType;
    entity_id: string;
    action: AuditAction;
    metadata?: Record<string, unknown> | null;
  }): Omit<AuditLogInsert, 'id'> {
    const data: Omit<AuditLogInsert, 'id' | 'remark'> = {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      actor_type: AuditActorType.System,
      actor_id: null,
      metadata: input.metadata ?? null,
    };
    return {
      ...data,
      remark: this.buildRemarkFromInput({ ...data, remark: '' }),
    };
  }

  private buildRemarkFromInput(input: Omit<AuditLogInsert, 'id'>) {
    const metadata = input.metadata ?? {};
    const amount = this.valueAsString(metadata.amount);
    const walletId = this.valueAsString(metadata.wallet_id);
    const reference = this.valueAsString(metadata.reference);
    const entryType = this.valueAsString(metadata.entry_type);
    const reason = this.valueAsString(metadata.reason);
    const senderWalletId = this.valueAsString(metadata.sender_wallet_id);
    const receiverWalletId = this.valueAsString(metadata.receiver_wallet_id);
    const ledgerEntryIds = this.valueAsArray(metadata.ledger_entry_ids);
    const availableBefore = this.valueAsString(
      metadata.available_balance_before,
    );
    const availableAfter = this.valueAsString(metadata.available_balance_after);
    const change = this.valueAsString(metadata.change);

    if (input.action === AuditAction.CreateIntent) {
      if (senderWalletId && receiverWalletId) {
        return `Created transfer intent from ${senderWalletId} to ${receiverWalletId} for ${amount ?? 'unknown amount'} with reference ${reference ?? 'N/A'}.`;
      }
      if (walletId) {
        return `Created transaction intent for wallet ${walletId} for ${amount ?? 'unknown amount'} with reference ${reference ?? 'N/A'}.`;
      }
      return `Created transaction intent ${input.entity_id}.`;
    }

    if (input.action === AuditAction.SettleTxn) {
      const ledgerPart = ledgerEntryIds.length
        ? ` Ledger entries: ${ledgerEntryIds.join(', ')}.`
        : '';
      return `Settled transaction intent ${input.entity_id} for ${amount ?? 'unknown amount'} with reference ${reference ?? 'N/A'}.${ledgerPart}`;
    }

    if (input.action === AuditAction.TxnFailed) {
      const reasonPart = reason ? ` Reason: ${reason}.` : '';
      return `Transaction intent ${input.entity_id} failed.${reasonPart}`;
    }

    if (input.action === AuditAction.CreateLedgerEntry) {
      const typePart = entryType ? `${entryType} ` : '';
      const walletPart = walletId ? ` for wallet ${walletId}` : '';
      return `Created ${typePart}ledger entry${walletPart} amount ${amount ?? 'unknown amount'}.`;
    }

    if (input.action === AuditAction.UpdateBalance) {
      const walletPart = walletId ? ` for wallet ${walletId}` : '';
      const rangePart =
        availableBefore && availableAfter
          ? ` from ${availableBefore} to ${availableAfter}`
          : '';
      const changePart = change ? ` (change ${change})` : '';
      return `Updated balance${walletPart}${rangePart}${changePart}.`;
    }

    return `Recorded audit log ${input.entity_id}.`;
  }

  private valueAsString(value: unknown) {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return undefined;
  }

  private valueAsArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.valueAsString(item))
      .filter(Boolean) as string[];
  }
}
