import { UserRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}
