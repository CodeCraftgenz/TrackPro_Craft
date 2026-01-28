import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatarUrl: string | null;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        name: string;
        id: string;
        email: string;
        passwordHash: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, data: {
        name?: string;
        avatarUrl?: string;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        avatarUrl: string | null;
        createdAt: Date;
    }>;
}
//# sourceMappingURL=users.service.d.ts.map