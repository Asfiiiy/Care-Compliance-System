import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Access denied.',
      );
    }

    const userRole =
      user.role as UserRole;

    /*
    |-------------------------------------------------------
    | Role Hierarchy
    |
    | ADMIN
    |   └── MANAGER
    |         └── STAFF
    |-------------------------------------------------------
    */

    const hierarchy: Record<
      UserRole,
      UserRole[]
    > = {
      ADMIN: [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.STAFF,
      ],

      MANAGER: [
        UserRole.MANAGER,
        UserRole.STAFF,
      ],

      STAFF: [
        UserRole.STAFF,
      ],
    };

    const allowedRoles =
      hierarchy[userRole] ?? [];

    const hasAccess =
      requiredRoles.some((role) =>
        allowedRoles.includes(role),
      );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}