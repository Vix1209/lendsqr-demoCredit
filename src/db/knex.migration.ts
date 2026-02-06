import path from 'path';
import dotenv from 'dotenv';
import { Knex } from 'knex';
import { buildKnexConfig } from './knex.module';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseConfig = buildKnexConfig();
const config: Knex.Config = {
  ...baseConfig,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    extension: 'ts',
  },
};

export default config;
