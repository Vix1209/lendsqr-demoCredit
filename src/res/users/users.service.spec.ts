import { ForbiddenException } from '@nestjs/common';
import { Knex } from 'knex';
import { BlacklistStatus } from '../blacklist/tables/blacklist.table';
import { UserStatus } from './tables/user.table';
import {
  BALANCES_TABLE,
  BLACKLISTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { UsersService } from './users.service';

describe('UsersService onboarding', () => {
  const createMockKnex = () => {
    const inserts: Record<string, Array<Record<string, unknown>>> = {};

    type MockTrx = (table: string) => {
      insert: (row: Record<string, unknown>) => Array<Record<string, unknown>>;
    };

    const trx: MockTrx = (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        inserts[table] = inserts[table] ?? [];
        inserts[table].push(row);
        return [row];
      },
    });
    const knex = {
      transaction: async (fn: (trx: MockTrx) => Promise<void>) => fn(trx),
    } as unknown as Knex;

    const dbService = {
      getDb: () => knex,
      findOne: () => undefined,
      insert: (
        table: string,
        data: Record<string, unknown>,
        trxArg?: MockTrx,
      ) => {
        if (trxArg) {
          return trxArg(table).insert(data);
        }
        inserts[table] = inserts[table] ?? [];
        inserts[table].push(data);
        return [data];
      },
    };

    return { knex, inserts, dbService };
  };

  const createMockBlacklistService = (status: BlacklistStatus) => ({
    checkKarmaByBvn: () => ({
      status,
      payload: {
        status: status === BlacklistStatus.Error ? 'error' : 'success',
        message: status === BlacklistStatus.Error ? 'Adjutor error' : 'OK',
        data:
          status === BlacklistStatus.Clear
            ? null
            : {
                karma_identity: 'redacted',
                amount_in_contention: '0.00',
                reason: null,
                default_date: '2020-05-18',
                karma_type: { karma: 'Others' },
                karma_identity_type: { identity_type: 'BVN' },
                reporting_entity: { name: 'Adjutor', email: 'support@adjutor' },
              },
      },
    }),
  });

  it('allows onboarding when blacklist is clear', async () => {
    const { dbService, inserts } = createMockKnex();
    const blacklistService = createMockBlacklistService(BlacklistStatus.Clear);
    const service = new UsersService(dbService as any, blacklistService as any);

    const result = await service.create({
      email: 'user@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone_number: '123',
      bvn: '22212345678',
      currency: 'NGN',
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: UserStatus.Active,
        blacklist_status: BlacklistStatus.Clear,
      }),
    );
    expect(result.wallet_id).toBeDefined();
    expect(inserts[USERS_TABLE]).toHaveLength(1);
    expect(inserts[BLACKLISTS_TABLE]).toHaveLength(1);
    expect(inserts[WALLETS_TABLE]).toHaveLength(1);
    expect(inserts[BALANCES_TABLE]).toHaveLength(1);
  });

  it('denies onboarding when blacklisted', async () => {
    const { dbService, inserts } = createMockKnex();
    const blacklistService = createMockBlacklistService(
      BlacklistStatus.Blacklisted,
    );
    const service = new UsersService(dbService as any, blacklistService as any);

    await expect(
      service.create({
        email: 'blacklisted@example.com',
        first_name: 'Bad',
        last_name: 'Actor',
        bvn: '22212345678',
        currency: 'NGN',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(inserts[USERS_TABLE]).toHaveLength(1);
    expect(inserts[BLACKLISTS_TABLE]).toHaveLength(1);
    expect(inserts[WALLETS_TABLE]).toBeUndefined();
    expect(inserts[BALANCES_TABLE]).toBeUndefined();
  });
});
