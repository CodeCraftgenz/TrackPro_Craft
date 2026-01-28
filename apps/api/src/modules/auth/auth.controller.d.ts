import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, LogoutDto } from './dto/auth.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<import("./auth.service").AuthTokens>;
    login(dto: LoginDto): Promise<import("./auth.service").AuthTokens>;
    refresh(dto: RefreshTokenDto): Promise<import("./auth.service").AuthTokens>;
    logout(user: JwtPayload, dto: LogoutDto): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map