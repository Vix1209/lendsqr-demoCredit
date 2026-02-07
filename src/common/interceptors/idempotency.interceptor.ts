import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { of, from, map, mergeMap, Observable } from 'rxjs';
import { IdempotencyKeysService } from 'src/resources/idempotency-keys/idempotency-keys.service';
import { IdempotencyStatus } from 'src/tables/idempotency_key.table';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly idempotencyKeysService: IdempotencyKeysService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const existing = request.idempotencyRecord;

    if (
      existing?.response_payload &&
      existing.status === IdempotencyStatus.Success
    ) {
      return of(this.parseResponse(existing.response_payload));
    }

    return next.handle().pipe(
      mergeMap((data) =>
        from(
          this.idempotencyKeysService.saveResponse({
            idempotency_key: request.idempotencyKey,
            request_hash: request.idempotencyRequestHash,
            response_payload: data,
          }),
        ).pipe(map(() => data)),
      ),
    );
  }

  private parseResponse(payload: unknown) {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return payload;
      }
    }
    return payload;
  }
}
