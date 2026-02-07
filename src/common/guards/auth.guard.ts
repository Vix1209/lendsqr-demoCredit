import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AUTH_HEADER } from 'src/common/constants/auth.constants';

type AuthPayload = {
  user_id: string;
  email?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.resolveToken(request);
    if (!token) {
      throw new UnauthorizedException(`${AUTH_HEADER} header is required`);
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token);
      (request as { user?: AuthPayload }).user = payload;
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private resolveToken(request: Request): string | undefined {
    const raw = request.headers?.[AUTH_HEADER];
    return this.normalizeHeaderValue(raw);
  }

  private normalizeHeaderValue(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (Array.isArray(value)) {
      const first = (value as string[])[0];
      return typeof first === 'string' ? first.trim() || undefined : undefined;
    }
    return undefined;
  }
}
