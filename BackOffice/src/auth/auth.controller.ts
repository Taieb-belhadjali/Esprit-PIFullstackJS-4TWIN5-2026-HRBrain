import { Controller, Post, Body, UseGuards, Request, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);
    // Redirect to frontend with token as query param
    const params = new URLSearchParams({
      token: result.token,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      id: result.user.id.toString(),
    });
    res.redirect(`http://localhost:5173/oauth/callback?${params.toString()}`);
  }
}
