import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnexModule } from 'nest-knexjs';
import { Knex } from 'knex';

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

@Global()
@Module({
  imports: [
    KnexModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        config: buildKnexConfig(configService),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
