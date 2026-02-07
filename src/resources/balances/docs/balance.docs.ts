import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { BalanceWithWalletDto } from '../dto/create-balance.dto';

export function GetBalanceByUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user balance with wallet' }),
    ApiOkResponse({ type: [BalanceWithWalletDto] }),
    ApiParam({ name: 'userId', example: 'USER-abc123' }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiNotFoundResponse({ description: 'Balance not found for user' }),
  );
}
