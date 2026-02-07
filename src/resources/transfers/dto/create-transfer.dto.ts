import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransferStatus } from '../../../tables/transfer.table';

export class CreateTransferDto {
  @ApiProperty({ example: 'wal-sender123' })
  @IsString()
  @IsNotEmpty()
  sender_wallet_id: string;

  @ApiProperty({ example: 'wal-receiver123' })
  @IsString()
  @IsNotEmpty()
  receiver_wallet_id: string;

  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  amount: string;

  @IsOptional()
  idempotency_key?: string;
}

export class CreateTransferResponseDto {
  @ApiProperty({ example: 'TRF-abc123' })
  transfer_id: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ example: 'wal-sender123' })
  sender_wallet_id: string;

  @ApiProperty({ example: 'wal-receiver123' })
  receiver_wallet_id: string;

  @ApiProperty({ example: '150.00' })
  amount: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'TRF_REF-abc123' })
  reference: string;
}

export class TransferHistoryQueryDto {
  @ApiPropertyOptional({ enum: TransferStatus })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional({ example: 'wal-sender123' })
  @IsString()
  @IsOptional()
  sender_wallet_id?: string;

  @ApiPropertyOptional({ example: 'wal-receiver123' })
  @IsString()
  @IsOptional()
  receiver_wallet_id?: string;

  @ApiPropertyOptional({ example: 'ref-123456' })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class TransferHistoryItemDto {
  @ApiProperty({ example: 'TRF-abc123' })
  id: string;

  @ApiProperty({ example: 'wal-sender123' })
  sender_wallet_id: string;

  @ApiProperty({ example: 'wal-receiver123' })
  receiver_wallet_id: string;

  @ApiProperty({ example: '150.00' })
  amount: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'ref-123456' })
  reference: string;

  @ApiProperty({ example: 'txn-123456' })
  transaction_intent_id: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}
