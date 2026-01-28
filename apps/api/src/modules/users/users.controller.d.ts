import { UsersService } from './users.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: JwtPayload): Promise<{
        name: string;
        id: string;
        email: string;
        avatarUrl: string | null;
        createdAt: Date;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map