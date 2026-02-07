import { Controller, Get, Param } from '@nestjs/common';
import { ExecutionAttemptsService } from './execution-attempts.service';
import { ListExecutionAttemptsDocs } from './docs/execution-attempts.docs';

@Controller('execution-attempts')
export class ExecutionAttemptsController {
  constructor(
    private readonly executionAttemptsService: ExecutionAttemptsService,
  ) {}

  @Get(':txn_id')
  @ListExecutionAttemptsDocs()
  listByTxn(@Param('txn_id') txnId: string) {
    return this.executionAttemptsService.listByTxnId(txnId);
  }
}
