import { Module } from '@nestjs/common';
import { IdempotencyGuard } from 'src/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { IdempotencyKeysModule } from 'src/resources/idempotency-keys/idempotency-keys.module';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [IdempotencyKeysModule, AuditLogsModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, IdempotencyGuard, IdempotencyInterceptor],
})
export class WithdrawalsModule {}
