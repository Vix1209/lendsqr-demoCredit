import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateFundingDto {
  @ApiProperty({ example: 'wal-abc123' })
  @IsString()
  @IsNotEmpty()
  wallet_id: string;

  @ApiProperty({ example: '250.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ example: 'adjutor' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'idem-abc123' })
  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}

export class CreateFundingResponseDto {
  @ApiProperty({ example: 'FND-abc123' })
  funding_id: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ example: 'wal-abc123' })
  wallet_id: string;

  @ApiProperty({ example: '250.00' })
  amount: string;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'FND_REF-abc123' })
  reference: string;

  @ApiProperty({ example: 'adjutor' })
  provider: string;
}
