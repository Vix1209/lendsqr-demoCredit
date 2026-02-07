import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/knex.module';
import { ExecutionAttemptsController } from './execution-attempts.controller';
import { ExecutionAttemptsService } from './execution-attempts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ExecutionAttemptsController],
  providers: [ExecutionAttemptsService],
})
export class ExecutionAttemptsModule {}
