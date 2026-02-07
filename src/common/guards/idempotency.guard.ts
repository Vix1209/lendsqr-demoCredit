import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdempotencyKeysService } from 'src/resources/idempotency-keys/idempotency-keys.service';
import { IdempotencyStatus } from 'src/tables/idempotency_key.table';
import {
  IDEMPOTENCY_BODY_KEY,
  IDEMPOTENCY_ID_HEADER,
  IDEMPOTENCY_REQUIRED_METADATA,
} from '../constants/idempotency.constant';
import { Request } from 'express';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyKeysService: IdempotencyKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_REQUIRED_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const idempotencyKey = this.resolveIdempotencyKey(request);
    if (!idempotencyKey) {
      throw new BadRequestException(
        `${IDEMPOTENCY_ID_HEADER} header is required`,
      );
    }

    const requestHash = this.idempotencyKeysService.buildRequestHash({
      method: request.method,
      path: request.originalUrl ?? request.url,
      params: request.params,
      query: request.query,
      body: request.body,
    });

    const existingKey =
      await this.idempotencyKeysService.findByKey(idempotencyKey);

    if (existingKey) {
      if (
        existingKey.request_hash &&
        existingKey.request_hash !== requestHash
      ) {
        throw new ConflictException('Idempotency key conflict');
      }
      if (
        existingKey.status === IdempotencyStatus.Processing &&
        !existingKey.response_payload
      ) {
        throw new ConflictException('Request is already processing');
      }
      (request as { idempotencyRecord?: unknown }).idempotencyRecord =
        existingKey;
    } else {
      await this.idempotencyKeysService.createProcessing({
        idempotency_key: idempotencyKey,
        request_hash: requestHash,
      });
    }

    (request as { idempotencyKey?: string }).idempotencyKey = idempotencyKey;
    (request as { idempotencyRequestHash?: string }).idempotencyRequestHash =
      requestHash;
    return true;
  }

  private resolveIdempotencyKey(request: Request): string | undefined {
    const headerKey = request.headers?.[IDEMPOTENCY_ID_HEADER];
    return (
      this.normalizeHeaderValue(headerKey) ??
      request.body?.[IDEMPOTENCY_BODY_KEY]
    );
  }

  private normalizeHeaderValue(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (Array.isArray(value)) {
      const first = (value as string[])[0];
      return typeof first === 'string' ? first.trim() || undefined : undefined;
    }
    return undefined;
  }
}
