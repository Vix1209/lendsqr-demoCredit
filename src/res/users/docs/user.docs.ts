import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateUserDto, CreateUserResponseDto } from '../dto/create-user.dto';

export function CreateUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new User' }),
    ApiBody({ type: CreateUserDto }),
    ApiCreatedResponse({ type: CreateUserResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiForbiddenResponse({ description: 'User is blacklisted' }),
  );
}
