import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, LogoutDto } from './dto/auth.dto';
import { CurrentUser, JwtPayload } from './decorators/current-user.decorator';

interface OAuthUser {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isSecure = this.isProduction();
    const sameSite = isSecure ? 'none' : 'lax';

    // Access token cookie - short lived
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh token cookie - long lived
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth', // Only sent to auth endpoints
    });
  }

  private clearAuthCookies(res: Response) {
    const isSecure = this.isProduction();
    const sameSite = isSecure ? 'none' : 'lax';

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/api/auth',
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    // Set httpOnly cookies
    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Return user info without exposing tokens in response body
    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    // Set httpOnly cookies
    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Return user info without exposing tokens in response body
    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshTokenDto) {
    // Get refresh token from cookie if not in body
    const refreshToken = dto.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    const result = await this.authService.refreshToken({ refreshToken });

    // Set new httpOnly cookies
    this.setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return {
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: JwtPayload, @Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: LogoutDto) {
    const refreshToken = dto.refreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(user.sub, refreshToken);
    }

    // Clear auth cookies
    this.clearAuthCookies(res);
  }

  // ==================== Google OAuth ====================

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as OAuthUser;
    const tokens = await this.authService.validateOAuthLogin(oauthUser);

    // Set httpOnly cookies instead of URL params
    this.setAuthCookies(res, tokens);

    // Redirect to frontend without tokens in URL (more secure)
    const frontendUrl = this.getFrontendUrl();
    res.redirect(`${frontendUrl}/auth/callback?success=true`);
  }

  // ==================== Microsoft OAuth ====================

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Microsoft' })
  async microsoftAuth() {
    // Guard redirects to Microsoft
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftAuthCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as OAuthUser;
    const tokens = await this.authService.validateOAuthLogin(oauthUser);

    // Set httpOnly cookies instead of URL params
    this.setAuthCookies(res, tokens);

    // Redirect to frontend without tokens in URL (more secure)
    const frontendUrl = this.getFrontendUrl();
    res.redirect(`${frontendUrl}/auth/callback?success=true`);
  }
}
