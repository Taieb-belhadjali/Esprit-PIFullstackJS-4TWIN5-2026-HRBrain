import { Controller, Post, Body, UseGuards, Request, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @Request() req: any,
    @Body() body: { newPassword: string },
  ) {
    return this.authService.changePassword(req.user.sub, body.newPassword);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Redirects to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);

    // Build redirect URL — uses FRONTEND_URL env var so it works in every environment
    // Local Docker : http://localhost:8888
    // Azure        : https://hrbrain.azurewebsites.net  (or custom domain)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:8888';

    const params = new URLSearchParams({
      token: result.token,
      name:  result.user.name,
      email: result.user.email,
      role:  result.user.role,
      id:    result.user.id.toString(),
    });

    res.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
  }
}
