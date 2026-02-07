import { Knex } from 'knex';
import { USERS_TABLE } from 'src/common/constants/table-names.constants';

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Blacklisted = 'blacklisted',
}

export type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
};

export type UserInsert = Omit<UserRow, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

export type UserUpdate = Partial<
  Omit<UserRow, 'id' | 'created_at' | 'updated_at'>
> & {
  updated_at?: Date;
};

export const buildUsersTable = (knex: Knex): Knex.SchemaBuilder =>
  knex.schema.createTable(USERS_TABLE, (table) => {
    table.string('id', 50).primary();
    table.string('email').notNullable().unique();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone_number').nullable();
    table
      .enum('status', Object.values(UserStatus))
      .notNullable()
      .defaultTo(UserStatus.Active);
    table.timestamps(true, true);
  });
