import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restrict endpoint access to specific roles.
 *
 * Example:
 * @Roles(UserRole.ADMIN)
 *
 * @Roles(UserRole.ADMIN, UserRole.MANAGER)
 */
export const Roles = (
  ...roles: UserRole[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);