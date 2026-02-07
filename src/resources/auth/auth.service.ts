import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IssueTokenDto } from './dto/issue-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issueToken(input: IssueTokenDto) {
    const secret = this.configService.get<string>('JWT_SECRET_KEY');
    if (!secret) {
      throw new UnauthorizedException('Missing JWT secret');
    }

    const expiresIn =
      this.configService.get<string>('JWT_EXPIRATION_TIME') ?? '3600';
    const payload: Record<string, string> = { user_id: input.user_id };
    if (input.email) {
      payload.email = input.email;
    }

    const token = await this.jwtService.signAsync(payload as any, {
      secret,
      expiresIn: Number(expiresIn),
    });

    return { token, expires_in: expiresIn };
  }
}
