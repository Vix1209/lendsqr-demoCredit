import { Controller, Get } from '@nestjs/common';
import { IdempotencyKeysService } from './idempotency-keys.service';
import { IdempotenceyKeyDocs } from './docs/idempotency_keys.docs';

@Controller('idempotency-keys')
export class IdempotencyKeysController {
  constructor(
    private readonly idempotencyKeysService: IdempotencyKeysService,
  ) {}

  @Get('new')
  @IdempotenceyKeyDocs()
  async generateKey() {
    const key = await this.idempotencyKeysService.generateKey();
    return { key };
  }
}
