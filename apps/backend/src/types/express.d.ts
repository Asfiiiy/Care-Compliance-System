import { UserRole, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      sub: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    }
  }
}

export {};