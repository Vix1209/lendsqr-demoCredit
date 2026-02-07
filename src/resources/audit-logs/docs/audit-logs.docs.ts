import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AuditAction,
  AuditActorType,
  EntityType,
} from 'src/tables/audit_log.table';
import { AuditLogDto } from '../dto/audit-log.dto';

export function ListAuditLogsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'List audit logs' }),
    ApiOkResponse({ type: [AuditLogDto] }),
    ApiQuery({ name: 'entity_type', required: false, enum: EntityType }),
    ApiQuery({ name: 'entity_id', required: false, example: 'USER-abc123' }),
    ApiQuery({ name: 'action', required: false, enum: AuditAction }),
    ApiQuery({ name: 'actor_type', required: false, enum: AuditActorType }),
    ApiQuery({ name: 'actor_id', required: false, example: 'USER-xyz123' }),
    ApiQuery({ name: 'from_date', required: false, example: '2026-02-01' }),
    ApiQuery({ name: 'to_date', required: false, example: '2026-02-07' }),
    ApiQuery({ name: 'limit', required: false, example: 50 }),
    ApiQuery({ name: 'offset', required: false, example: 0 }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}

export function GetAuditLogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get audit log by id' }),
    ApiParam({ name: 'id', example: 'AUDIT-abc123' }),
    ApiOkResponse({ type: AuditLogDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiNotFoundResponse({ description: 'Audit log not found' }),
  );
}
