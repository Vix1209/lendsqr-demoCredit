import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/knex.module';
import { IdempotencyKeysService } from './idempotency-keys.service';
import { IdempotencyKeysController } from './idempotency-keys.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [IdempotencyKeysController],
  providers: [IdempotencyKeysService],
  exports: [IdempotencyKeysService],
})
export class IdempotencyKeysModule {}
