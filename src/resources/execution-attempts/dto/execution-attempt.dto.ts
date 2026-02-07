import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExecutionStatus } from 'src/tables/execution_attempt.table';

export class ExecutionAttemptDto {
  @ApiProperty({ example: 'ATMPT-abc123' })
  id: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ enum: ExecutionStatus })
  status: ExecutionStatus;

  @ApiProperty({ example: 1 })
  attempt_number: number;

  @ApiProperty({ example: 'paystack' })
  provider: string;

  @ApiPropertyOptional({ example: 'PROV-abc123', nullable: true })
  provider_reference?: string | null;

  @ApiPropertyOptional({
    example: { message: 'queued' },
    nullable: true,
  })
  response_payload?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-02-07T10:00:00.000Z' })
  attempted_at: Date;
}
