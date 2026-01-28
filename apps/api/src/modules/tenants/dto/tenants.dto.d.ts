import { MemberRole } from '@prisma/client';
export declare class CreateTenantDto {
    name: string;
}
export declare class UpdateTenantDto {
    name: string;
}
export declare class AddMemberDto {
    email: string;
    role: MemberRole;
}
export declare class UpdateMemberRoleDto {
    role: MemberRole;
}
//# sourceMappingURL=tenants.dto.d.ts.map