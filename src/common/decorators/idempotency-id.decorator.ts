// This decorator is used to extract the idempotency id from the request headers
// If the header is not present or is empty, undefined is returned

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IDEMPOTENCY_ID_HEADER } from '../constants/idempotency.constant';

function normalizeHeaderValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    const first = (value as string[])[0];
    return typeof first === 'string' ? first.trim() || undefined : undefined;
  }
  return undefined;
}

export const IdempotencyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers?: Record<string, unknown> }>();
    const headers = request?.headers ?? {};
    const raw = headers[IDEMPOTENCY_ID_HEADER];
    return normalizeHeaderValue(raw);
  },
);
