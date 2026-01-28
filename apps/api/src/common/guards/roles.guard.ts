import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  ANALYST: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user || !user.role) {
      return false;
    }

    const userRole = user.role as MemberRole;
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

    // User has access if their role level is >= any of the required roles
    return requiredRoles.some((role) => userRoleLevel >= ROLE_HIERARCHY[role]);
  }
}
