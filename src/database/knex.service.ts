import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
export const KNEX_CONNECTION = 'KNEX_CONNECTION';

@Injectable()
export class KnexService {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}
  get connection(): Knex {
    return this.db;
  }
}
