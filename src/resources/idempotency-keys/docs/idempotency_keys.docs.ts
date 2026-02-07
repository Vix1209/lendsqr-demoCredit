import { applyDecorators } from '@nestjs/common';

import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { IdempotencyKeyResponseDto } from '../dto/create-idempotency-key.dto';

export function IdempotenceyKeyDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Generate idempotency key' }),
    ApiOkResponse({
      description: 'Idempotency key generated',
      type: IdempotencyKeyResponseDto,
    }),
  );
}
