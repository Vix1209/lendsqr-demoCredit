import {
  applyDecorators,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IdempotencyGuard } from 'src/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import {
  IDEMPOTENCY_ID_HEADER,
  IDEMPOTENCY_REQUIRED_METADATA,
} from 'src/common/constants/idempotency.constant';

export const Idempotent = () =>
  applyDecorators(
    SetMetadata(IDEMPOTENCY_REQUIRED_METADATA, true),
    UseGuards(IdempotencyGuard),
    UseInterceptors(IdempotencyInterceptor),
    ApiBearerAuth(IDEMPOTENCY_ID_HEADER),
  );
