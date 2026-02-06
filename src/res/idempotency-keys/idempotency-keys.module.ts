import { Module } from '@nestjs/common';
import { IdempotencyKeysService } from './idempotency-keys.service';
import { IdempotencyKeysController } from './idempotency-keys.controller';

@Module({
  controllers: [IdempotencyKeysController],
  providers: [IdempotencyKeysService],
})
export class IdempotencyKeysModule {}
