import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LedgerEntryDto } from '../dto/ledger-entry.dto';

export function ListLedgerEntriesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'List ledger entries' }),
    ApiOkResponse({ type: [LedgerEntryDto] }),
    ApiQuery({ name: 'wallet_id', required: false, example: 'WAL-abc123' }),
    ApiQuery({ name: 'user_id', required: false, example: 'USER-abc123' }),
    ApiQuery({
      name: 'txn_intent_id',
      required: false,
      example: 'TXN_INTENT-abc123',
    }),
    ApiQuery({ name: 'from_date', required: false, example: '2026-02-01' }),
    ApiQuery({ name: 'to_date', required: false, example: '2026-02-07' }),
    ApiQuery({ name: 'limit', required: false, example: 50 }),
    ApiQuery({ name: 'offset', required: false, example: 0 }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}

export function GetLedgerEntryDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get ledger entry by id' }),
    ApiParam({ name: 'ledger_id', example: 'LEDGER-abc123' }),
    ApiOkResponse({ type: LedgerEntryDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiNotFoundResponse({ description: 'Ledger entry not found' }),
  );
}
