import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SessionService } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ session: { role: string; name: string; customerId?: string } }> {
    const result = await this.authService.login(body);

    response.cookie(this.sessionService.cookieName, result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.sessionService.secureCookie,
      maxAge: this.sessionService.sessionTtlMs,
      path: '/'
    });

    return { session: result.session };
  }

  @Get('session')
  async getSession(
    @Req() request: Request
  ): Promise<{ session: { role: string; name: string; customerId?: string } | null }> {
    const session = await this.sessionService.resolveRequestSession(
      request.cookies as Record<string, string | undefined>
    );
    return { session };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionId = (request.cookies as Record<string, string | undefined>)[
      this.sessionService.cookieName
    ];
    await this.sessionService.clearSession(sessionId);
    response.clearCookie(this.sessionService.cookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.sessionService.secureCookie,
      path: '/'
    });
  }
}
