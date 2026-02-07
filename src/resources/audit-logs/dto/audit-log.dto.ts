import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AuditAction,
  AuditActorType,
  EntityType,
} from 'src/tables/audit_log.table';

export class AuditLogDto {
  @ApiProperty({ example: 'AUDIT-abc123' })
  id: string;

  @ApiProperty({ enum: EntityType })
  entity_type: EntityType;

  @ApiProperty({ example: 'USER-abc123' })
  entity_id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: AuditActorType })
  actor_type: AuditActorType;

  @ApiProperty({ example: 'USER-xyz123', nullable: true })
  actor_id: string | null;

  @ApiPropertyOptional({
    example: { reason: 'status_change' },
    nullable: true,
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-02-07T10:00:00.000Z' })
  created_at: Date;
}
