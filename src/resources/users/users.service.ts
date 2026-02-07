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

    const userId = generateId('USER');
    const blacklistId = generateId('BLVK_LIST');

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
        walletId = generateId('wal');
        const balanceId = generateId('bal');

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
      .select([
        'id',
        'email',
        'first_name',
        'last_name',
        'phone_number',
        'status',
        'created_at',
        'updated_at',
      ])
      .offset(offset)
      .limit(limit);

    if (query.sort_status) {
      dataQuery.orderBy('status', query.sort_status);
    }
    dataQuery.orderBy('created_at', 'desc');

    const data = await dataQuery;
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
    const user = await this.knex.findOne(USERS_TABLE, { id }, [
      'id',
      'email',
      'first_name',
      'last_name',
      'phone_number',
      'status',
      'created_at',
      'updated_at',
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
