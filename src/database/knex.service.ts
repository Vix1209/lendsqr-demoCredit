import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  getDb() {
    return this.knex;
  }

  async findOne(
    tableName: string,
    where: Record<string, unknown>,
    select?: string[],
  ): Promise<any> {
    const existingUser = await this.getDb()
      .table(tableName)
      .where(where)
      .select(select || ['*'])
      .first();

    return existingUser;
  }

  async insert<TRecord extends Record<string, unknown>>(
    tableName: string,
    data: TRecord | TRecord[],
  ) {
    return await this.getDb().table(tableName).insert(data);
  }

  async update<TRecord extends Record<string, unknown>>(
    tableName: string,
    where: Record<string, unknown>,
    data: TRecord,
  ) {
    return await this.getDb().table(tableName).where(where).update(data);
  }

  async remove(tableName: string, where: Record<string, unknown>) {
    return await this.getDb().table(tableName).where(where).delete();
  }
}
