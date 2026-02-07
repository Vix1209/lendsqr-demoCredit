import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ExecutionAttemptDto } from '../dto/execution-attempt.dto';

export function ListExecutionAttemptsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'List execution attempts by transaction intent' }),
    ApiParam({ name: 'txn_id', example: 'TXN_INTENT-abc123' }),
    ApiOkResponse({ type: [ExecutionAttemptDto] }),
    ApiNotFoundResponse({ description: 'Transaction intent not found' }),
  );
}
