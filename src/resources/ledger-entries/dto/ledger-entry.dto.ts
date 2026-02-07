import { ApiProperty } from '@nestjs/swagger';
import { LedgerEntryType } from 'src/tables/ledger_entry.table';

export class LedgerEntryDto {
  @ApiProperty({ example: 'LEDGER-abc123' })
  id: string;

  @ApiProperty({ example: 'WAL-abc123' })
  wallet_id: string;

  @ApiProperty({ example: 'TXN_INTENT-abc123' })
  transaction_intent_id: string;

  @ApiProperty({ enum: LedgerEntryType })
  entry_type: LedgerEntryType;

  @ApiProperty({ example: '2500.00' })
  amount: string;

  @ApiProperty({ example: '10000.00' })
  balance_before: string;

  @ApiProperty({ example: '12500.00' })
  balance_after: string;

  @ApiProperty({ example: '2026-02-07T10:00:00.000Z' })
  created_at: Date;
}
