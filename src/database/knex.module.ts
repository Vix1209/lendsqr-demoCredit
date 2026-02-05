import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import { KnexService, KNEX_CONNECTION } from './knex.service';

const knexProvider = {
  provide: KNEX_CONNECTION,
  useFactory: (configService: ConfigService): Knex => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const poolMinValue = Number.parseInt(
      configService.get<string>('DB_POOL_MIN') ?? '',
      10,
    );
    const poolMaxValue = Number.parseInt(
      configService.get<string>('DB_POOL_MAX') ?? '',
      10,
    );
    const poolMin = Number.isFinite(poolMinValue) ? poolMinValue : 2;
    const poolMax = Number.isFinite(poolMaxValue) ? poolMaxValue : 10;

    if (databaseUrl) {
      return knex({
        client: 'mysql2',
        connection: databaseUrl,
        pool: { min: poolMin, max: poolMax },
      });
    }

    const host = configService.get<string>('DB_HOST');
    const portValue = Number.parseInt(
      configService.get<string>('DB_PORT') ?? '',
      10,
    );
    const port = Number.isFinite(portValue) ? portValue : 3306;
    const user = configService.get<string>('DB_USER');
    const password = configService.get<string>('DB_PASSWORD');
    const database = configService.get<string>('DB_NAME');

    if (!host || !user || !password || !database || !port) {
      Logger.warn(
        'Database configuration missing. Set DATABASE_URL or provide DB_HOST, DB_USER, DB_NAME e.t.c in .env.',
      );
    }

    return knex({
      client: 'mysql2',
      connection: { host, port, user, password, database },
      pool: { min: poolMin, max: poolMax },
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [KnexService, knexProvider],
  exports: [KnexService, knexProvider],
})
export class KnexModule {}
