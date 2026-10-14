import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '@prisma/client';
import { AppError } from './error.middleware';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../lib/prisma';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing or malformed Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = AuthService.verifyAccessToken(token);

    // Verify session in DB if available
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            fullName: true,
          },
        },
      },
    });

    if (!session || session.isRevoked || new Date() > session.expiresAt) {
      return next(new AppError('Session has expired or was revoked. Please log in again.', 401));
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      return next(new AppError('Account is currently inactive or suspended.', 403));
    }

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(' or ')}`,
          403
        )
      );
    }

    next();
  };
};
