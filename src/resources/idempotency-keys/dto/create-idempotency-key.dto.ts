import { ApiProperty } from '@nestjs/swagger';

export class CreateIdempotencyKeyDto {}

export class IdempotencyKeyResponseDto {
  @ApiProperty({ example: 'IDEMPOTENCY_KEY-abc123' })
  key: string;
}
