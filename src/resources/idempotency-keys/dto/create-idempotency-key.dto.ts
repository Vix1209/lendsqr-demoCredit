import { ApiProperty } from '@nestjs/swagger';

export class CreateIdempotencyKeyDto {}

export class IdempotencyKeyResponseDto {
  @ApiProperty({ example: 'KEY-abc123' })
  key: string;
}
