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

export const IDEMPOTENCY_REQUIRED = 'idempotency_required';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyKeysService: IdempotencyKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_REQUIRED,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = this.resolveIdempotencyKey(request);
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
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
      request.idempotencyRecord = existingKey;
    } else {
      await this.idempotencyKeysService.createProcessing({
        idempotency_key: idempotencyKey,
        request_hash: requestHash,
      });
    }

    request.idempotencyKey = idempotencyKey;
    request.idempotencyRequestHash = requestHash;
    return true;
  }

  private resolveIdempotencyKey(request: any): string | undefined {
    const headerKey =
      request.headers?.['idempotency-key'] ??
      request.headers?.['x-idempotency-key'];
    return headerKey ?? request.body?.idempotency_key;
  }
}
