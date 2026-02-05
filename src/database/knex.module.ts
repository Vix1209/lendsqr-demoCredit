import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import { KnexService, KNEX_CONNECTION } from './knex.service';

const getEnvValue = (
  key: string,
  configService?: ConfigService,
): string | undefined => {
  if (configService) {
    return configService.get<string>(key);
  }
  return process.env[key];
};

export const buildKnexConfig = (configService?: ConfigService): Knex.Config => {
  const databaseUrl = getEnvValue('DATABASE_URL', configService);
  const poolMinValue = Number.parseInt(
    getEnvValue('DB_POOL_MIN', configService) ?? '',
    10,
  );
  const poolMaxValue = Number.parseInt(
    getEnvValue('DB_POOL_MAX', configService) ?? '',
    10,
  );
  const poolMin = Number.isFinite(poolMinValue) ? poolMinValue : 2;
  const poolMax = Number.isFinite(poolMaxValue) ? poolMaxValue : 10;

  if (!databaseUrl) {
    throw new Error(
      'Database configuration missing. Set DATABASE_URL in .env.',
    );
  }

  return {
    client: 'mysql2',
    connection: databaseUrl,
    pool: { min: poolMin, max: poolMax },
  };
};

const knexProvider = {
  provide: KNEX_CONNECTION,
  useFactory: (configService: ConfigService): Knex => {
    const config = buildKnexConfig(configService);
    return knex(config);
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [KnexService, knexProvider],
  exports: [KnexService, knexProvider],
})
export class KnexModule {}
