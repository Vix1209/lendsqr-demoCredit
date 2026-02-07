import { ApiProperty } from '@nestjs/swagger';

export class CreateBalanceDto {}

export class BalanceSummaryDto {
  @ApiProperty({ example: 'BAL-abc123' })
  id: string;

  @ApiProperty({ example: 'wal-abc123' })
  wallet_id: string;

  @ApiProperty({ example: '250.00' })
  available_balance: string;

  @ApiProperty({ example: '0.00' })
  pending_balance: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}

export class WalletSummaryDto {
  @ApiProperty({ example: 'wal-abc123' })
  id: string;

  @ApiProperty({ example: 'USER-abc123' })
  user_id: string;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({
    example: { bank_account_number: '0123456789', bank_code: '016' },
  })
  account_details: Record<string, string>;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}

export class BalanceWithWalletDto {
  @ApiProperty({ type: BalanceSummaryDto })
  balance: BalanceSummaryDto;

  @ApiProperty({ type: WalletSummaryDto })
  wallet: WalletSummaryDto;
}
