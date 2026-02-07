import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { IDEMPOTENCY_KEYS_TABLE } from 'src/common/constants/table-names.constants';
import { generateId } from 'src/common/utils/customId.utils';
import {
  ID_PREFIX_IDEMPOTENCY_KEY,
  ID_PREFIX_IDEMPOTENCY_RECORD,
} from 'src/common/constants/id-prefix.constants';
import { IDEMPOTENCY_BODY_KEY } from 'src/common/constants/idempotency.constant';
import { DatabaseService } from 'src/database/knex.service';
import {
  IdempotencyKeyInsert,
  IdempotencyKeyRow,
  IdempotencyKeyUpdate,
  IdempotencyStatus,
} from '../../tables/idempotency_key.table';

@Injectable()
export class IdempotencyKeysService {
  constructor(private readonly knex: DatabaseService) {}

  async generateKey() {
    let idempotencyKey = generateId(ID_PREFIX_IDEMPOTENCY_KEY);
    let exists = await this.findByKey(idempotencyKey);
    while (exists) {
      idempotencyKey = generateId(ID_PREFIX_IDEMPOTENCY_KEY);
      exists = await this.findByKey(idempotencyKey);
    }
    return idempotencyKey;
  }

  async findByKey(key: string): Promise<IdempotencyKeyRow | null> {
    return this.knex.findOne(IDEMPOTENCY_KEYS_TABLE, {
      [IDEMPOTENCY_BODY_KEY]: key,
    });
  }

  async create(data: IdempotencyKeyInsert) {
    await this.knex.insert(IDEMPOTENCY_KEYS_TABLE, data);
    return data;
  }

  async updateByKey(key: string, update: IdempotencyKeyUpdate) {
    return this.knex.update(
      IDEMPOTENCY_KEYS_TABLE,
      { [IDEMPOTENCY_BODY_KEY]: key },
      update,
    );
  }

  async createProcessing(input: {
    idempotency_key: string;
    request_hash: string;
  }) {
    return this.create({
      id: generateId(ID_PREFIX_IDEMPOTENCY_RECORD),
      idempotency_key: input.idempotency_key,
      request_hash: input.request_hash,
      status: IdempotencyStatus.Processing,
      response_payload: null,
    });
  }

  async saveResponse(input: {
    idempotency_key?: string;
    request_hash?: string;
    response_payload: unknown;
  }) {
    if (!input.idempotency_key) {
      return;
    }
    const existing = await this.findByKey(input.idempotency_key);
    const responsePayload = JSON.stringify(input.response_payload ?? null);

    if (existing) {
      const requestHash = existing.request_hash || input.request_hash || '';
      await this.updateByKey(input.idempotency_key, {
        request_hash: requestHash,
        status: IdempotencyStatus.Success,
        response_payload: responsePayload,
      });
      return;
    }

    await this.create({
      id: generateId(ID_PREFIX_IDEMPOTENCY_RECORD),
      idempotency_key: input.idempotency_key,
      request_hash: input.request_hash || '',
      status: IdempotencyStatus.Success,
      response_payload: responsePayload,
    });
  }

  buildRequestHash(input: {
    method: string;
    path: string;
    params: unknown;
    query: unknown;
    body: unknown;
  }): string {
    const payload = {
      method: input.method,
      path: input.path,
      params: this.normalizeValue(input.params),
      query: this.normalizeValue(input.query),
      body: this.normalizeValue(input.body),
    };
    const serialized = JSON.stringify(payload);
    return createHash('sha256').update(serialized).digest('hex');
  }

  private normalizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item));
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sortedKeys = Object.keys(record).sort();
      const normalized: Record<string, unknown> = {};
      for (const key of sortedKeys) {
        normalized[key] = this.normalizeValue(record[key]);
      }
      return normalized;
    }

    return value;
  }
}
