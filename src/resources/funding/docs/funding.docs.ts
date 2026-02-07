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
  CreateFundingDto,
  CreateFundingResponseDto,
  FundingHistoryItemDto,
} from '../dto/create-funding.dto';
import { FundingStatus } from '../../../tables/funding.table';

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

export function FundingHistoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Funding history' }),
    ApiOkResponse({ type: [FundingHistoryItemDto] }),
    ApiQuery({ name: 'status', required: false, enum: FundingStatus }),
    ApiQuery({ name: 'wallet_id', required: false }),
    ApiQuery({ name: 'reference', required: false }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}
