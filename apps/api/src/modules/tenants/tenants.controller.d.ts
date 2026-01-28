import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, AddMemberDto, UpdateMemberRoleDto } from './dto/tenants.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(user: JwtPayload, dto: CreateTenantDto): Promise<{
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
    findAll(user: JwtPayload): Promise<({
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
    findOne(user: JwtPayload, id: string): Promise<{
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
    update(user: JwtPayload, id: string, dto: UpdateTenantDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    delete(user: JwtPayload, id: string): Promise<void>;
    addMember(user: JwtPayload, id: string, dto: AddMemberDto): Promise<{
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
    removeMember(user: JwtPayload, id: string, userId: string): Promise<void>;
    updateMemberRole(user: JwtPayload, id: string, userId: string, dto: UpdateMemberRoleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tenantId: string;
        role: import("@prisma/client").$Enums.MemberRole;
    }>;
}
//# sourceMappingURL=tenants.controller.d.ts.map