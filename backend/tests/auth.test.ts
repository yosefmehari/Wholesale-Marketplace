import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      session: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      business: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      businessMembership: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(prisma);
      }),
    },
  };
});

describe('Authentication & Authorization Suite (Stage 3)', () => {
  const mockPasswordHash = bcrypt.hashSync('StrongPass123!', 10);

  const mockUser = {
    id: 'user-cuid-123',
    email: 'testbuyer@wholesalehub.et',
    passwordHash: mockPasswordHash,
    fullName: 'Test Buyer PLC',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    phone: '+251911223344',
    isEmailVerified: true,
    isPhoneVerified: true,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 'admin-cuid-999',
    email: 'admin@wholesalehub.et',
    passwordHash: mockPasswordHash,
    fullName: 'Platform Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    phone: '+251911999888',
    isEmailVerified: true,
    isPhoneVerified: true,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new valid buyer user and return access & refresh tokens', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.session.create).mockResolvedValueOnce({
        id: 'session-id-1',
        userId: mockUser.id,
        refreshTokenHash: 'hash',
        ipAddress: null,
        userAgent: null,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.session.update).mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Buyer PLC',
          email: 'testbuyer@wholesalehub.et',
          password: 'StrongPass123!',
          phone: '+251911223344',
          role: 'BUYER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testbuyer@wholesalehub.et');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject registration if email is already taken with 409 Conflict', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Buyer PLC',
          email: 'testbuyer@wholesalehub.et',
          password: 'StrongPass123!',
          role: 'BUYER',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should reject registration with invalid password (missing digit/length) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Buyer PLC',
          email: 'valid@wholesalehub.et',
          password: 'weak',
          role: 'BUYER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user with valid credentials and return tokens', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.session.create).mockResolvedValueOnce({
        id: 'session-id-2',
        userId: mockUser.id,
        refreshTokenHash: 'temp-hash',
        ipAddress: null,
        userAgent: null,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.session.update).mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testbuyer@wholesalehub.et',
          password: 'StrongPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with wrong password with 401 Unauthorized', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testbuyer@wholesalehub.et',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject login for suspended account with 403 Forbidden', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testbuyer@wholesalehub.et',
          password: 'StrongPass123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('suspended');
    });
  });

  describe('Role-Based Authorization & Protected Endpoints', () => {
    it('should reject access to protected endpoint without Bearer token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Authentication required');
    });

    it('should reject a BUYER trying to access an ADMIN route with 403 Forbidden', async () => {
      const tokens = AuthService.generateTokens(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: UserRole.BUYER,
          status: UserStatus.ACTIVE,
          fullName: mockUser.fullName,
        },
        'session-test-id'
      );

      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
        id: 'session-test-id',
        userId: mockUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: UserRole.BUYER,
          status: UserStatus.ACTIVE,
          fullName: mockUser.fullName,
        },
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Insufficient privileges');
    });

    it('should allow an ADMIN to access the ADMIN route with 200 OK', async () => {
      const tokens = AuthService.generateTokens(
        {
          id: mockAdminUser.id,
          email: mockAdminUser.email,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          fullName: mockAdminUser.fullName,
        },
        'session-admin-id'
      );

      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
        id: 'session-admin-id',
        userId: mockAdminUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
        user: {
          id: mockAdminUser.id,
          email: mockAdminUser.email,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          fullName: mockAdminUser.fullName,
        },
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/test')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Admin authorization granted');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke the active session on logout', async () => {
      const tokens = AuthService.generateTokens(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: UserRole.BUYER,
          status: UserStatus.ACTIVE,
          fullName: mockUser.fullName,
        },
        'session-logout-id'
      );

      vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
        id: 'session-logout-id',
        userId: mockUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: UserRole.BUYER,
          status: UserStatus.ACTIVE,
          fullName: mockUser.fullName,
        },
      } as any);

      vi.mocked(prisma.session.updateMany).mockResolvedValueOnce({ count: 1 } as any);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Logged out successfully');
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-logout-id' },
        data: { isRevoked: true },
      });
    });
  });
});
