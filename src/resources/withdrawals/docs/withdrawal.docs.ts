import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateWithdrawalDto,
  CreateWithdrawalResponseDto,
  WithdrawalHistoryItemDto,
} from '../dto/create-withdrawal.dto';
import { WithdrawalStatus } from '../../../tables/withdrawal.table';

export function CreateWithdrawalDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a withdrawal' }),
    ApiBody({ type: CreateWithdrawalDto }),
    ApiCreatedResponse({ type: CreateWithdrawalResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiForbiddenResponse({ description: 'User is blacklisted' }),
    ApiNotFoundResponse({ description: 'Wallet not found' }),
    ApiConflictResponse({ description: 'Idempotency key conflict' }),
  );
}

export function WithdrawalHistoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Withdrawal history' }),
    ApiOkResponse({ type: [WithdrawalHistoryItemDto] }),
    ApiQuery({ name: 'status', required: false, enum: WithdrawalStatus }),
    ApiQuery({ name: 'wallet_id', required: false }),
    ApiQuery({ name: 'reference', required: false }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}
