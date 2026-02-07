import { Module } from '@nestjs/common';
import { IdempotencyGuard } from 'src/common/guards/idempotency.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { IdempotencyKeysModule } from 'src/resources/idempotency-keys/idempotency-keys.module';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  imports: [IdempotencyKeysModule, AuditLogsModule],
  controllers: [TransfersController],
  providers: [TransfersService, IdempotencyGuard, IdempotencyInterceptor],
})
export class TransfersModule {}
