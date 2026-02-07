import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { FundingStatus } from '../../../tables/funding.table';

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

  @IsOptional()
  idempotency_key?: string;
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

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'FND_REF-abc123' })
  reference: string;

  @ApiProperty({ example: 'adjutor' })
  provider: string;
}

export class FundingHistoryQueryDto {
  @ApiPropertyOptional({ enum: FundingStatus })
  @IsOptional()
  status?: FundingStatus;

  @ApiPropertyOptional({ example: 'wal-abc123' })
  @IsString()
  @IsOptional()
  wallet_id?: string;

  @ApiPropertyOptional({ example: 'FND_REF-abc123' })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class FundingHistoryItemDto {
  @ApiProperty({ example: 'FND-abc123' })
  id: string;

  @ApiProperty({ example: 'wal-abc123' })
  wallet_id: string;

  @ApiProperty({ example: '250.00' })
  amount: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'FND_REF-abc123' })
  reference: string;

  @ApiProperty({ example: 'adjutor' })
  provider: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}
