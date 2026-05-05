import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/shemas/user.shema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: (configService.get<string>('BACKEND_URL') ?? 'http://localhost:3000') + '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new UnauthorizedException('No email from Google'), false);

    const user = await this.userModel.findOne({ email });
    if (!user) {
      return done(
        new UnauthorizedException('Aucun compte associé à cet email Google'),
        false,
      );
    }

    // Only allow Google login if mustChangePassword is false
    if (user.mustChangePassword) {
      return done(
        new UnauthorizedException('Vous devez d\'abord changer votre mot de passe'),
        false,
      );
    }

    return done(null, user);
  }
}
