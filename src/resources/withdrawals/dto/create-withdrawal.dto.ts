import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'wal-abc123' })
  @IsString()
  @IsNotEmpty()
  wallet_id: string;

  @ApiProperty({ example: '75.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ example: 'bank:0123456789' })
  @IsString()
  @IsNotEmpty()
  destination: string;

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

  @ApiProperty({ example: 'bank:0123456789' })
  destination: string;
}
