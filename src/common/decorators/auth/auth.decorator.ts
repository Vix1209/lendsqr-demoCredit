import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AUTH_HEADER } from 'src/common/constants/auth.constants';
import { AuthGuard } from 'src/common/guards/auth.guard';

export const Authenticated = () =>
  applyDecorators(UseGuards(AuthGuard), ApiBearerAuth(AUTH_HEADER));
