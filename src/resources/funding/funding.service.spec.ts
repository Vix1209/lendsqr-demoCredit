import { ForbiddenException } from '@nestjs/common';
import { Knex } from 'knex';
import {
  BALANCES_TABLE,
  FUNDINGS_TABLE,
  IDEMPOTENCY_KEYS_TABLE,
  LEDGER_ENTRIES_TABLE,
  TRANSACTION_INTENTS_TABLE,
  USERS_TABLE,
  WALLETS_TABLE,
} from '../../common/constants/table-names.constants';
import { IdempotencyStatus } from '../../tables/idempotency_key.table';
import { UserStatus } from '../../tables/user.table';
import { FundingService } from './funding.service';

type RecordMap = Record<string, Array<Record<string, any>>>;

const createMockDb = () => {
  const records: RecordMap = {
    [USERS_TABLE]: [],
    [WALLETS_TABLE]: [],
    [BALANCES_TABLE]: [],
    [IDEMPOTENCY_KEYS_TABLE]: [],
    [TRANSACTION_INTENTS_TABLE]: [],
    [FUNDINGS_TABLE]: [],
    [LEDGER_ENTRIES_TABLE]: [],
  };

  const match = (row: Record<string, any>, where: Record<string, any>) =>
    Object.entries(where).every(([key, value]) => row[key] === value);

  const find = (table: string, where: Record<string, any>) =>
    records[table]?.find((row) => match(row, where));

  const buildTable = (table: string) => ({
    insert: (data: any) => {
      const rows = Array.isArray(data) ? data : [data];
      records[table].push(...rows);
      return rows;
    },
    where: (where: Record<string, any>) => ({
      first: () => find(table, where),
      update: (data: Record<string, any>) => {
        const row = find(table, where);
        if (!row) {
          return 0;
        }
        Object.assign(row, data);
        return 1;
      },
    }),
  });

  const trx = {
    table: (table: string) => buildTable(table),
  };

  const knex = {
    transaction: async (fn: (trx: any) => Promise<any>) => fn(trx),
  } as unknown as Knex;

  const dbService = {
    getDb: () => knex,
    findOne: (table: string, where: Record<string, any>) => find(table, where),
  };

  return { dbService, records };
};

describe('FundingService', () => {
  it('credits wallet and writes ledger entries on success', async () => {
    const { dbService, records } = createMockDb();
    records[USERS_TABLE].push({
      id: 'user-1',
      email: 'test@example.com',
      status: UserStatus.Active,
    });
    records[WALLETS_TABLE].push({
      id: 'wallet-1',
      user_id: 'user-1',
      currency: 'NGN',
    });
    records[BALANCES_TABLE].push({
      id: 'bal-1',
      wallet_id: 'wallet-1',
      available_balance: '0.00',
      pending_balance: '0.00',
    });

    const service = new FundingService(
      dbService as any,
      {
        createLog: jest.fn(),
        buildSystemLog: (input: any) => input,
      } as any,
    );

    const response = await service.create({
      wallet_id: 'wallet-1',
      amount: '250.00',
      provider: 'adjutor',
      idempotency_key: 'idem-1',
    });

    expect(response.status).toBe('success');
    expect(records[LEDGER_ENTRIES_TABLE]).toHaveLength(2);
    const updatedBalance = records[BALANCES_TABLE].find(
      (row) => row.wallet_id === 'wallet-1',
    );
    expect(updatedBalance?.available_balance).toBe('250.00');
  });

  it('blocks funding when user is blacklisted', async () => {
    const { dbService, records } = createMockDb();
    records[USERS_TABLE].push({
      id: 'user-2',
      email: 'blocked@example.com',
      status: UserStatus.Blacklisted,
    });
    records[WALLETS_TABLE].push({
      id: 'wallet-2',
      user_id: 'user-2',
      currency: 'NGN',
    });

    const service = new FundingService(
      dbService as any,
      {
        createLog: jest.fn(),
        buildSystemLog: (input: any) => input,
      } as any,
    );

    await expect(
      service.create({
        wallet_id: 'wallet-2',
        amount: '100.00',
        provider: 'adjutor',
        idempotency_key: 'idem-2',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('processes funding even when an idempotency record exists', async () => {
    const { dbService, records } = createMockDb();
    records[USERS_TABLE].push({
      id: 'user-3',
      email: 'replay@example.com',
      status: UserStatus.Active,
    });
    records[WALLETS_TABLE].push({
      id: 'wallet-3',
      user_id: 'user-3',
      currency: 'NGN',
    });
    records[IDEMPOTENCY_KEYS_TABLE].push({
      id: 'idem-row',
      idempotency_key: 'idem-3',
      request_hash:
        '73e4af88fbbd792db63dd2528a2b751cd2a0fef3fcffa61eb0e8c78bfba52f2d',
      status: IdempotencyStatus.Success,
      response_payload: {
        status: 'success',
        amount: '90.00',
      },
    });

    const service = new FundingService(
      dbService as any,
      {
        createLog: jest.fn(),
        buildSystemLog: (input: any) => input,
      } as any,
    );
    const response = await service.create({
      wallet_id: 'wallet-3',
      amount: '90.00',
      provider: 'adjutor',
      idempotency_key: 'idem-3',
    });

    expect(response.status).toBe('success');
    expect(response.amount).toBe('90.00');
  });
});
