import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AUDIT_LOGS_TABLE } from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import { ID_PREFIX_AUDIT } from 'src/common/constants/id-prefix.constants';
import { DatabaseService } from 'src/database/knex.service';
import {
  AuditAction,
  AuditActorType,
  AuditLogInsert,
  EntityType,
} from '../../tables/audit_log.table';

@Injectable()
export class AuditLogsService {
  constructor(private readonly knex: DatabaseService) {}

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
