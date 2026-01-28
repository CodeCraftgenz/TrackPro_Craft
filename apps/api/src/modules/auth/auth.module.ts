import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { MfaController } from './mfa.controller';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { UsersModule } from '../users/users.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          },
        };
      },
    }),
    UsersModule,
    IntegrationsModule,
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, MfaService, JwtStrategy, GoogleStrategy, MicrosoftStrategy],
  exports: [AuthService, MfaService],
})
export class AuthModule {}
