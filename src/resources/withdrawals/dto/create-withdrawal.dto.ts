import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { WithdrawalStatus } from '../../../tables/withdrawal.table';

export class WithdrawalDestinationDto {
  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  bank_account_number: string;

  @ApiProperty({ example: '016' })
  @IsString()
  @IsNotEmpty()
  bank_code: string;
}

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'wal-abc123' })
  @IsString()
  @IsNotEmpty()
  wallet_id: string;

  @ApiProperty({ example: '75.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ type: WithdrawalDestinationDto, required: false })
  @IsOptional()
  destination?: WithdrawalDestinationDto;

  @IsOptional()
  idempotency_key?: string;
}

export class CreateWithdrawalResponseDto {
  @ApiProperty({ example: 'WDR-abc123' })
  withdrawal_id: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ example: 'wal-abc123' })
  wallet_id: string;

  @ApiProperty({ example: '75.00' })
  amount: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'WDR_REF-abc123' })
  reference: string;

  @ApiProperty({ type: WithdrawalDestinationDto })
  destination: WithdrawalDestinationDto;
}

export class WithdrawalHistoryQueryDto {
  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ example: 'WAL-abc123' })
  @IsString()
  @IsOptional()
  wallet_id?: string;

  @ApiPropertyOptional({ example: 'WDR_REF-abc123' })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class WithdrawalHistoryItemDto {
  @ApiProperty({ example: 'WDR-abc123' })
  id: string;

  @ApiProperty({ example: 'wal-abc123' })
  wallet_id: string;

  @ApiProperty({ example: '75.00' })
  amount: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'WDR_REF-abc123' })
  reference: string;

  @ApiProperty({ example: 'bank:016:0123456789' })
  destination: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}
