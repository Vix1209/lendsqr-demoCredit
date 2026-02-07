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
    fromDate?: Date;
    toDate?: Date;
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
    if (input.fromDate) {
      query.where('created_at', '>=', input.fromDate);
    }
    if (input.toDate) {
      query.where('created_at', '<=', input.toDate);
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
    return {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      actor_type: AuditActorType.System,
      actor_id: null,
      metadata: input.metadata ?? null,
    };
  }
}
