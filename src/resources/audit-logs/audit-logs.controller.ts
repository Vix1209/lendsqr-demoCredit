import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import {
  AuditAction,
  AuditActorType,
  EntityType,
} from 'src/tables/audit_log.table';
import { GetAuditLogDocs, ListAuditLogsDocs } from './docs/audit-logs.docs';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ListAuditLogsDocs()
  async list(
    @Query('entity_type') entityType?: EntityType,
    @Query('entity_id') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('actor_type') actorType?: AuditActorType,
    @Query('actor_id') actorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    const parsedOffset = offset ? Number(offset) : 0;

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('limit must be a positive number');
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      throw new BadRequestException('offset must be a non-negative number');
    }

    return this.auditLogsService.list({
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_type: actorType,
      actor_id: actorId,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  }

  @Get(':id')
  @GetAuditLogDocs()
  async getById(@Param('id') id: string) {
    const log = await this.auditLogsService.getById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }

  private parseDate(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} must be a valid date`);
    }
    return parsed;
  }
}
