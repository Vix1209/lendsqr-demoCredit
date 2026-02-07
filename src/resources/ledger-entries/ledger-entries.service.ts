import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LEDGER_ENTRIES_TABLE,
  WALLETS_TABLE,
} from 'src/common/constants/table-names.constants';
import { DatabaseService } from 'src/database/knex.service';
import { LedgerEntryRow } from 'src/tables/ledger_entry.table';

type LedgerEntriesFilter = {
  limit: number;
  offset: number;
  fromDate?: Date;
  toDate?: Date;
};

@Injectable()
export class LedgerEntriesService {
  constructor(private readonly knex: DatabaseService) {}

  async listAll(input: {
    limit: number;
    offset: number;
  }): Promise<LedgerEntryRow[]> {
    return this.knex
      .getDb()
      .table(LEDGER_ENTRIES_TABLE)
      .orderBy('created_at', 'desc')
      .limit(input.limit)
      .offset(input.offset);
  }

  async findById(id: string): Promise<LedgerEntryRow> {
    const entry = await this.knex.findOne(LEDGER_ENTRIES_TABLE, { id });
    if (!entry) {
      throw new NotFoundException('Ledger entry not found');
    }
    return entry;
  }

  async findByWallet(
    walletId: string,
    input: LedgerEntriesFilter,
  ): Promise<LedgerEntryRow[]> {
    const query = this.knex
      .getDb()
      .table(LEDGER_ENTRIES_TABLE)
      .where('wallet_id', walletId);

    if (input.fromDate) {
      query.where('created_at', '>=', input.fromDate);
    }
    if (input.toDate) {
      query.where('created_at', '<=', input.toDate);
    }

    return query
      .orderBy('created_at', 'desc')
      .limit(input.limit)
      .offset(input.offset);
  }

  async findByUser(
    userId: string,
    input: LedgerEntriesFilter,
  ): Promise<LedgerEntryRow[]> {
    const query = this.knex
      .getDb()
      .table(LEDGER_ENTRIES_TABLE)
      .join(
        WALLETS_TABLE,
        `${LEDGER_ENTRIES_TABLE}.wallet_id`,
        `${WALLETS_TABLE}.id`,
      )
      .select([`${LEDGER_ENTRIES_TABLE}.*`])
      .where(`${WALLETS_TABLE}.user_id`, userId);

    if (input.fromDate) {
      query.where(`${LEDGER_ENTRIES_TABLE}.created_at`, '>=', input.fromDate);
    }
    if (input.toDate) {
      query.where(`${LEDGER_ENTRIES_TABLE}.created_at`, '<=', input.toDate);
    }

    return query
      .orderBy(`${LEDGER_ENTRIES_TABLE}.created_at`, 'desc')
      .limit(input.limit)
      .offset(input.offset);
  }

  async findByTxnIntent(
    txnIntentId: string,
    input: LedgerEntriesFilter,
  ): Promise<LedgerEntryRow[]> {
    const query = this.knex
      .getDb()
      .table(LEDGER_ENTRIES_TABLE)
      .where('transaction_intent_id', txnIntentId);

    if (input.fromDate) {
      query.where('created_at', '>=', input.fromDate);
    }
    if (input.toDate) {
      query.where('created_at', '<=', input.toDate);
    }

    return query
      .orderBy('created_at', 'desc')
      .limit(input.limit)
      .offset(input.offset);
  }
}
