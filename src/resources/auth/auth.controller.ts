import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IssueTokenDto } from './dto/issue-token.dto';
import { IssueTokenDocs } from './docs/auth.docs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  @IssueTokenDocs()
  issue(@Body() input: IssueTokenDto) {
    return this.authService.issueToken(input);
  }
}
