import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  getDb() {
    return this.knex;
  }
}
