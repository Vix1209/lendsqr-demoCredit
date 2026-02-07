import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateId } from '../../common/utils/customId.utils';
import { BlacklistStatus } from '../../tables/blacklist.table';
import { BlacklistService } from '../blacklist/blacklist.service';
import {
  BALANCES_TABLE,
  BLACKLISTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import {
  ID_PREFIX_BALANCE,
  ID_PREFIX_BLACKLIST,
  ID_PREFIX_USER,
  ID_PREFIX_WALLET,
} from 'src/common/constants/id-prefix.constants';
import { UserStatus } from '../../tables/user.table';
import { WalletStatus } from '../../tables/wallet.table';
import { CreateUserDto, ListUsersQueryDto } from './dto/create-user.dto';
import { DatabaseService } from 'src/database/knex.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly knex: DatabaseService,
    private readonly blacklistService: BlacklistService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.knex.findOne(USERS_TABLE, {
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ForbiddenException('Email already exists');
    }

    const userId = generateId(ID_PREFIX_USER);
    const blacklistId = generateId(ID_PREFIX_BLACKLIST);

    const { status: blacklistStatus, payload: blacklistPayload } =
      await this.blacklistService.checkKarmaByBvn(createUserDto.bvn);

    const userStatus =
      blacklistStatus === BlacklistStatus.Clear
        ? UserStatus.Active
        : UserStatus.Blacklisted;

    const provider = createUserDto.blacklist_provider ?? 'adjutor';
    const currency = createUserDto.currency ?? 'NGN';
    let walletId: string | null = null;

    await this.knex.getDb().transaction(async () => {
      await this.knex.insert(USERS_TABLE, {
        id: userId,
        email: createUserDto.email,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        phone_number: createUserDto.phone_number ?? null,
        status: userStatus,
      });

      await this.knex.insert(BLACKLISTS_TABLE, {
        id: blacklistId,
        user_id: userId,
        provider,
        status: blacklistStatus,
        response_payload: blacklistPayload,
      });

      if (blacklistStatus === BlacklistStatus.Clear) {
        walletId = generateId(ID_PREFIX_WALLET);
        const balanceId = generateId(ID_PREFIX_BALANCE);

        await this.knex.insert(WALLETS_TABLE, {
          id: walletId,
          user_id: userId,
          currency,
          account_details: createUserDto.account_details ?? {
            bank_account_number: '',
            bank_code: '',
          },
          status: WalletStatus.Active,
        });

        await this.knex.insert(BALANCES_TABLE, {
          id: balanceId,
          wallet_id: walletId,
          available_balance: '0',
          pending_balance: '0',
        });
      }
    });

    if (blacklistStatus !== BlacklistStatus.Clear) {
      throw new ForbiddenException('User is blacklisted');
    }

    return {
      user_id: userId,
      wallet_id: walletId,
      status: userStatus,
      blacklist_status: blacklistStatus,
    };
  }

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const baseQuery = this.knex.getDb().table(USERS_TABLE);
    if (query.status) {
      baseQuery.where('status', query.status);
    }

    const countRow = await baseQuery
      .clone()
      .count<{ total: string | number }>({ total: '*' })
      .first();
    const totalValue =
      typeof countRow?.total === 'string'
        ? Number.parseInt(countRow.total, 10)
        : (countRow?.total ?? 0);

    const dataQuery = baseQuery
      .clone()
      .leftJoin(WALLETS_TABLE, `${USERS_TABLE}.id`, `${WALLETS_TABLE}.user_id`)
      .leftJoin(
        BALANCES_TABLE,
        `${WALLETS_TABLE}.id`,
        `${BALANCES_TABLE}.wallet_id`,
      )
      .select([
        `${USERS_TABLE}.id as id`,
        `${USERS_TABLE}.email as email`,
        `${USERS_TABLE}.first_name as first_name`,
        `${USERS_TABLE}.last_name as last_name`,
        `${USERS_TABLE}.phone_number as phone_number`,
        `${USERS_TABLE}.status as status`,
        `${USERS_TABLE}.created_at as created_at`,
        `${USERS_TABLE}.updated_at as updated_at`,
        `${WALLETS_TABLE}.id as wallet_id`,
        `${WALLETS_TABLE}.currency as wallet_currency`,
        `${WALLETS_TABLE}.account_details as wallet_account_details`,
        `${WALLETS_TABLE}.status as wallet_status`,
        `${WALLETS_TABLE}.created_at as wallet_created_at`,
        `${WALLETS_TABLE}.updated_at as wallet_updated_at`,
        `${BALANCES_TABLE}.id as balance_id`,
        `${BALANCES_TABLE}.available_balance as balance_available`,
        `${BALANCES_TABLE}.pending_balance as balance_pending`,
        `${BALANCES_TABLE}.created_at as balance_created_at`,
        `${BALANCES_TABLE}.updated_at as balance_updated_at`,
      ])
      .offset(offset)
      .limit(limit);

    if (query.sort_status) {
      dataQuery.orderBy('status', query.sort_status);
    }
    dataQuery.orderBy('created_at', 'desc');

    const rows = await dataQuery;
    const data = rows.map((row) => ({
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone_number: row.phone_number,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      wallet: row.wallet_id
        ? {
            id: row.wallet_id,
            currency: row.wallet_currency,
            account_details: row.wallet_account_details,
            status: row.wallet_status,
            created_at: row.wallet_created_at,
            updated_at: row.wallet_updated_at,
            balance: row.balance_id
              ? {
                  id: row.balance_id,
                  wallet_id: row.wallet_id,
                  available_balance: row.balance_available,
                  pending_balance: row.balance_pending,
                  created_at: row.balance_created_at,
                  updated_at: row.balance_updated_at,
                }
              : null,
          }
        : null,
    }));
    const pages =
      limit > 0 ? Math.ceil(totalValue / limit) : totalValue > 0 ? 1 : 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalValue,
        pages,
      },
    };
  }

  async get(id: string) {
    const row = await this.knex
      .getDb()
      .table(USERS_TABLE)
      .leftJoin(WALLETS_TABLE, `${USERS_TABLE}.id`, `${WALLETS_TABLE}.user_id`)
      .leftJoin(
        BALANCES_TABLE,
        `${WALLETS_TABLE}.id`,
        `${BALANCES_TABLE}.wallet_id`,
      )
      .select([
        `${USERS_TABLE}.id as id`,
        `${USERS_TABLE}.email as email`,
        `${USERS_TABLE}.first_name as first_name`,
        `${USERS_TABLE}.last_name as last_name`,
        `${USERS_TABLE}.phone_number as phone_number`,
        `${USERS_TABLE}.status as status`,
        `${USERS_TABLE}.created_at as created_at`,
        `${USERS_TABLE}.updated_at as updated_at`,
        `${WALLETS_TABLE}.id as wallet_id`,
        `${WALLETS_TABLE}.currency as wallet_currency`,
        `${WALLETS_TABLE}.account_details as wallet_account_details`,
        `${WALLETS_TABLE}.status as wallet_status`,
        `${WALLETS_TABLE}.created_at as wallet_created_at`,
        `${WALLETS_TABLE}.updated_at as wallet_updated_at`,
        `${BALANCES_TABLE}.id as balance_id`,
        `${BALANCES_TABLE}.available_balance as balance_available`,
        `${BALANCES_TABLE}.pending_balance as balance_pending`,
        `${BALANCES_TABLE}.created_at as balance_created_at`,
        `${BALANCES_TABLE}.updated_at as balance_updated_at`,
      ])
      .where(`${USERS_TABLE}.id`, id)
      .first();

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone_number: row.phone_number,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      wallet: row.wallet_id
        ? {
            id: row.wallet_id,
            currency: row.wallet_currency,
            account_details: row.wallet_account_details,
            status: row.wallet_status,
            created_at: row.wallet_created_at,
            updated_at: row.wallet_updated_at,
            balance: row.balance_id
              ? {
                  id: row.balance_id,
                  wallet_id: row.wallet_id,
                  available_balance: row.balance_available,
                  pending_balance: row.balance_pending,
                  created_at: row.balance_created_at,
                  updated_at: row.balance_updated_at,
                }
              : null,
          }
        : null,
    };
  }
}
