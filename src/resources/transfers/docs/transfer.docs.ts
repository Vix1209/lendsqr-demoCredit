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
  CreateTransferDto,
  CreateTransferResponseDto,
  TransferHistoryItemDto,
} from '../dto/create-transfer.dto';
import { TransferStatus } from '../../../tables/transfer.table';

export function CreateTransferDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a transfer' }),
    ApiBody({ type: CreateTransferDto }),
    ApiCreatedResponse({ type: CreateTransferResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiForbiddenResponse({ description: 'User is blacklisted' }),
    ApiNotFoundResponse({ description: 'Wallet not found' }),
    ApiConflictResponse({ description: 'Idempotency key conflict' }),
  );
}

export function TransferHistoryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Transfer history' }),
    ApiOkResponse({ type: [TransferHistoryItemDto] }),
    ApiQuery({ name: 'status', required: false, enum: TransferStatus }),
    ApiQuery({ name: 'sender_wallet_id', required: false }),
    ApiQuery({ name: 'receiver_wallet_id', required: false }),
    ApiQuery({ name: 'reference', required: false }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}
