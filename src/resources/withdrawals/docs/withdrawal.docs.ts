import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateWithdrawalDto,
  CreateWithdrawalResponseDto,
} from '../dto/create-withdrawal.dto';

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
