import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthUser } from '../../types/express';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 900 seconds (15 mins)
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  createdAt: Date;
}

export class AuthService {
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateTokens(user: AuthUser, sessionId: string): AuthTokens {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ sub: user.id, sessionId }, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
      throw new AppError('Invalid or expired authentication token', 401);
    }
  }

  static verifyRefreshToken(token: string): { sub: string; sessionId: string } {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; sessionId: string };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  static sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  static async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new AppError('A user with this email address already exists', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: dto.role,
        status: UserStatus.ACTIVE,
        // Auto-create cart for buyers
        ...(dto.role === UserRole.BUYER ? { cart: { create: {} } } : {}),
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(crypto.randomBytes(32).toString('hex')),
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const tokens = this.generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.fullName,
      },
      session.id
    );

    // Update session with actual hashed refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(tokens.refreshToken),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  static async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact customer support.', 403);
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new AppError('Your account has been deactivated.', 403);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Create a new session
    const tempHash = this.hashToken(crypto.randomBytes(32).toString('hex'));
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: tempHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = this.generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.fullName,
      },
      session.id
    );

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(tokens.refreshToken),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  static async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.refreshTokenHash !== tokenHash) {
      // Possible reuse attack: revoke session if it existed
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
      }
      throw new AppError('Invalid or expired refresh token session', 401);
    }

    if (new Date() > session.expiresAt) {
      throw new AppError('Refresh token session has expired', 401);
    }

    const { user } = session;
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError('Account is not active', 403);
    }

    // Rotate tokens
    const tokens = this.generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.fullName,
      },
      session.id
    );

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      tokens,
    };
  }

  static async logout(sessionId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }
}
