import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
interface TokenPayload {
    sub: string;
    email: string;
    tenantId?: string;
    role?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly usersService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, usersService: UsersService);
    register(dto: RegisterDto): Promise<AuthTokens>;
    login(dto: LoginDto): Promise<AuthTokens>;
    refreshToken(dto: RefreshTokenDto): Promise<AuthTokens>;
    logout(userId: string, refreshToken?: string): Promise<void>;
    private generateTokens;
    validateUser(payload: TokenPayload): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: Date;
    }>;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map