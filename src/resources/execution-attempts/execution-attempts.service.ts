import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EXECUTION_ATTEMPTS_TABLE,
  TRANSACTION_INTENTS_TABLE,
} from 'src/common/constants/table-names.constants';
import { DatabaseService } from 'src/database/knex.service';
import { ExecutionAttemptRow } from 'src/tables/execution_attempt.table';

@Injectable()
export class ExecutionAttemptsService {
  constructor(private readonly knex: DatabaseService) {}

  async listByTxnId(txnId: string): Promise<ExecutionAttemptRow[]> {
    const txn = await this.knex.findOne(TRANSACTION_INTENTS_TABLE, {
      id: txnId,
    });
    if (!txn) {
      throw new NotFoundException('Transaction intent not found');
    }

    return this.knex
      .getDb()
      .table(EXECUTION_ATTEMPTS_TABLE)
      .where('transaction_intent_id', txnId)
      .orderBy('attempted_at', 'desc');
  }
}
