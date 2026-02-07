import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IssueTokenDto, IssueTokenResponseDto } from '../dto/issue-token.dto';

export function IssueTokenDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Issue short-lived access token' }),
    ApiBody({ type: IssueTokenDto }),
    ApiOkResponse({ type: IssueTokenResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiUnauthorizedResponse({ description: 'Missing JWT secret' }),
  );
}
