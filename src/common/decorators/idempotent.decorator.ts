import {
  applyDecorators,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import {
  IdempotencyGuard,
  IDEMPOTENCY_REQUIRED,
} from 'src/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

export const Idempotent = () =>
  applyDecorators(
    SetMetadata(IDEMPOTENCY_REQUIRED, true),
    UseGuards(IdempotencyGuard),
    UseInterceptors(IdempotencyInterceptor),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description: 'Prevents duplicate processing of the same request',
    }),
  );
