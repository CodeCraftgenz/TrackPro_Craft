import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, AddMemberDto } from './dto/tenants.dto';
export declare class TenantsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateTenantDto): Promise<{
        memberships: ({
            user: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            tenantId: string;
            role: import("@prisma/client").$Enums.MemberRole;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    findAllForUser(userId: string): Promise<({
        memberships: {
            role: import("@prisma/client").$Enums.MemberRole;
        }[];
        _count: {
            memberships: number;
            projects: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    })[]>;
    findById(tenantId: string, userId: string): Promise<{
        memberships: ({
            user: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            tenantId: string;
            role: import("@prisma/client").$Enums.MemberRole;
        })[];
        _count: {
            projects: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    update(tenantId: string, userId: string, dto: UpdateTenantDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    delete(tenantId: string, userId: string): Promise<void>;
    addMember(tenantId: string, actorUserId: string, dto: AddMemberDto): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tenantId: string;
        role: import("@prisma/client").$Enums.MemberRole;
    }>;
    removeMember(tenantId: string, actorUserId: string, memberUserId: string): Promise<void>;
    updateMemberRole(tenantId: string, actorUserId: string, memberUserId: string, role: MemberRole): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tenantId: string;
        role: import("@prisma/client").$Enums.MemberRole;
    }>;
    private checkOwnerPermission;
    private checkAdminPermission;
    private generateSlug;
}
//# sourceMappingURL=tenants.service.d.ts.map