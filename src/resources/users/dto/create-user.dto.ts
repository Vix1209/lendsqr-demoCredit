import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../tables/user.table';

export class AccountDetails {
  @IsString()
  bank_account_number: string;

  @IsString()
  bank_code: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ example: '08012345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: '22212345678' })
  @IsString()
  bvn: string;

  @ApiPropertyOptional({
    example: "{bank_account_number: '0123456789', bank_code: '016'}",
  })
  account_details: AccountDetails;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'adjutor' })
  @IsOptional()
  @IsString()
  blacklist_provider?: string;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: 'USER-abc123' })
  user_id: string;

  @ApiProperty({ example: 'wal-abc123', nullable: true })
  wallet_id: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'clear' })
  blacklist_status: string;
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ enum: SortDirection })
  @IsEnum(SortDirection)
  @IsOptional()
  sort_status?: SortDirection;
}

export class UserListItemDto {
  @ApiProperty({ example: 'USER-abc123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Ada' })
  first_name: string;

  @ApiProperty({ example: 'Lovelace' })
  last_name: string;

  @ApiProperty({ example: '08012345678', nullable: true })
  phone_number: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}

export class SingleUserResponseDto {
  @ApiProperty({ example: 'USER-abc123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Ada' })
  first_name: string;

  @ApiProperty({ example: 'Lovelace' })
  last_name: string;

  @ApiProperty({ example: '08012345678', nullable: true })
  phone_number: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-06T10:00:00.000Z' })
  updated_at: Date;
}

export class ListUsersPaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 3 })
  pages: number;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [UserListItemDto] })
  data: UserListItemDto[];

  @ApiProperty({ type: ListUsersPaginationDto })
  pagination: ListUsersPaginationDto;
}
