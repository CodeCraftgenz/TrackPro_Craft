import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';

interface TokenPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email}`);

    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke the old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(storedToken.user.id, storedToken.user.email);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: refreshToken,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for the user
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId?: string,
    role?: string,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: userId,
      email,
    };

    if (tenantId) payload.tenantId = tenantId;
    if (role) payload.role = role;

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async validateUser(payload: TokenPayload) {
    return this.usersService.findById(payload.sub);
  }
}
