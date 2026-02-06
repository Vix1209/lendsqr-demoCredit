import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

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
