import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateUserDto,
  CreateUserResponseDto,
  ListUsersResponseDto,
  SingleUserResponseDto,
  SortDirection,
} from '../dto/create-user.dto';
import { UserStatus } from '../../../tables/user.table';

export function CreateUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new User' }),
    ApiBody({ type: CreateUserDto }),
    ApiCreatedResponse({ type: CreateUserResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiForbiddenResponse({ description: 'User is blacklisted' }),
  );
}

export function ListUsersDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'List users' }),
    ApiOkResponse({ type: ListUsersResponseDto }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'limit', required: false, example: 20 }),
    ApiQuery({ name: 'status', required: false, enum: UserStatus }),
    ApiQuery({ name: 'sort_status', required: false, enum: SortDirection }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
  );
}

export function GetUserDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a user by id' }),
    ApiOkResponse({ type: SingleUserResponseDto }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );
}
