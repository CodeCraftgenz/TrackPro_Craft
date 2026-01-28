import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';

interface MicrosoftProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  _json?: {
    mail?: string;
    userPrincipalName?: string;
  };
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID', ''),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'MICROSOFT_CALLBACK_URL',
        'http://localhost:3001/api/v1/auth/microsoft/callback',
      ),
      scope: ['user.read'],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: MicrosoftProfile,
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const email =
      profile.emails?.[0]?.value ||
      profile._json?.mail ||
      profile._json?.userPrincipalName;

    const user = {
      provider: 'microsoft',
      providerId: profile.id,
      email,
      name: profile.displayName,
      accessToken,
    };

    done(null, user);
  }
}
