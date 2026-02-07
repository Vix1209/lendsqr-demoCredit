import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BALANCES_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { DatabaseService } from 'src/database/knex.service';

@Injectable()
export class BalancesService {
  constructor(private readonly knex: DatabaseService) {}

  async getByUserId(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const rows = await this.knex
      .getDb()
      .table(BALANCES_TABLE)
      .join(WALLETS_TABLE, `${BALANCES_TABLE}.wallet_id`, `${WALLETS_TABLE}.id`)
      .select([
        `${BALANCES_TABLE}.id as balance_id`,
        `${BALANCES_TABLE}.wallet_id as balance_wallet_id`,
        `${BALANCES_TABLE}.available_balance`,
        `${BALANCES_TABLE}.pending_balance`,
        `${BALANCES_TABLE}.created_at as balance_created_at`,
        `${BALANCES_TABLE}.updated_at as balance_updated_at`,
        `${WALLETS_TABLE}.id as wallet_id`,
        `${WALLETS_TABLE}.user_id as wallet_user_id`,
        `${WALLETS_TABLE}.currency`,
        `${WALLETS_TABLE}.account_details`,
        `${WALLETS_TABLE}.status as wallet_status`,
        `${WALLETS_TABLE}.created_at as wallet_created_at`,
        `${WALLETS_TABLE}.updated_at as wallet_updated_at`,
      ])
      .where(`${WALLETS_TABLE}.user_id`, userId);

    if (rows.length === 0) {
      throw new NotFoundException('Balance not found for user');
    }

    return rows.map((row) => ({
      balance: {
        id: row.balance_id,
        wallet_id: row.balance_wallet_id,
        available_balance: row.available_balance,
        pending_balance: row.pending_balance,
        created_at: row.balance_created_at,
        updated_at: row.balance_updated_at,
      },
      wallet: {
        id: row.wallet_id,
        user_id: row.wallet_user_id,
        currency: row.currency,
        account_details: row.account_details,
        status: row.wallet_status,
        created_at: row.wallet_created_at,
        updated_at: row.wallet_updated_at,
      },
    }));
  }
}
