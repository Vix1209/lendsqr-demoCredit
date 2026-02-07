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
  CreateFundingDto,
  CreateFundingResponseDto,
} from '../dto/create-funding.dto';

export function CreateFundingDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a funding request' }),
    ApiBody({ type: CreateFundingDto }),
    ApiCreatedResponse({ type: CreateFundingResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiForbiddenResponse({ description: 'User is blacklisted' }),
    ApiNotFoundResponse({ description: 'Wallet not found' }),
    ApiConflictResponse({ description: 'Idempotency key conflict' }),
  );
}
