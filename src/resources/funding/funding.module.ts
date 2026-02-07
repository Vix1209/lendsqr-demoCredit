import { Module } from '@nestjs/common';
import { IdempotencyGuard } from 'src/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { IdempotencyKeysModule } from 'src/resources/idempotency-keys/idempotency-keys.module';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';

@Module({
  imports: [IdempotencyKeysModule, AuditLogsModule],
  controllers: [FundingController],
  providers: [FundingService, IdempotencyGuard, IdempotencyInterceptor],
})
export class FundingModule {}
