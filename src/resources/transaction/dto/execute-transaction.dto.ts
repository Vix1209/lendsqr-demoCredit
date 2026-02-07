import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum TransactionExecutionType {
  Funding = 'funding',
  Transfer = 'transfer',
  Withdrawal = 'withdrawal',
}

export class ExecuteTransactionDto {
  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  @IsString()
  @IsNotEmpty()
  transaction_intent_id: string;

  @ApiProperty({ enum: TransactionExecutionType })
  @IsEnum(TransactionExecutionType)
  type: TransactionExecutionType;
}
