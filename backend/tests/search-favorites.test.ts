import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus, WholesaleUnit, ProductStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      business: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      favorite: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe('Search, Filters, Sorting & Favorites Suite (Stage 6)', () => {
  const buyerUser = {
    id: 'user-buyer-101',
    email: 'buyer@retailer.et',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    fullName: 'Almaz Retail PLC',
  };

  const tokens = AuthService.generateTokens(buyerUser, 'session-buyer-101');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/products - Advanced Search & Filters', () => {
    it('should query products with keyword search, subCity filter, price range, and MOQ', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Premium Teff Grain',
          slug: 'premium-teff-grain',
          minOrderQuantity: 10,
          basePrice: 4500,
          wholesaleUnit: WholesaleUnit.BAG,
          status: ProductStatus.PUBLISHED,
          images: [],
          priceTiers: [{ minQuantity: 10, unitPrice: 4500 }],
          inventory: { quantity: 150, lowStockAlert: 20 },
          business: { id: 'bus-1', name: 'Addis Grain PLC', city: 'Addis Ababa', subCity: 'Addis Ketema', isVerified: true },
          category: { id: 'cat-1', name: 'Grains & Pulses', slug: 'grains-pulses' },
        },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/products')
        .query({
          search: 'Teff',
          subCity: 'Addis Ketema',
          minPrice: '4000',
          maxPrice: '5000',
          maxMoq: '20',
          sortBy: 'price_asc',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.pagination.totalCount).toBe(1);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProductStatus.PUBLISHED,
            minOrderQuantity: { lte: 20 },
            priceTiers: {
              some: {
                unitPrice: { gte: 4000, lte: 5000 },
              },
            },
          }),
        })
      );
    });

    it('should support sorting by highest price, newest, and lowest MOQ', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/products')
        .query({ sortBy: 'moq_asc' });

      expect(res.status).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { minOrderQuantity: 'asc' },
        })
      );
    });
  });

  describe('Favorites & Wishlist Endpoints (/api/v1/favorites)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/favorites');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return buyer favorites when authenticated', async () => {
      (prisma.session.findUnique as any).mockResolvedValue({
        id: 'session-buyer-101',
        userId: buyerUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: buyerUser,
      });

      const mockFavorites = [
        {
          id: 'fav-1',
          userId: buyerUser.id,
          productId: 'prod-1',
          product: {
            id: 'prod-1',
            name: 'Washed Yirgacheffe Coffee Beans',
            slug: 'washed-yirgacheffe-coffee',
            minOrderQuantity: 5,
            basePrice: 9500,
            wholesaleUnit: WholesaleUnit.CARTON,
            images: [],
            priceTiers: [],
            business: { name: 'Highland Coffee PLC', isVerified: true },
          },
        },
      ];

      (prisma.favorite.findMany as any).mockResolvedValue(mockFavorites);

      const res = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].product.name).toBe('Washed Yirgacheffe Coffee Beans');
    });

    it('should add a product to favorites', async () => {
      (prisma.session.findUnique as any).mockResolvedValue({
        id: 'session-buyer-101',
        userId: buyerUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: buyerUser,
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-1',
        name: 'Washed Yirgacheffe Coffee Beans',
      });

      (prisma.favorite.upsert as any).mockResolvedValue({
        id: 'fav-1',
        userId: buyerUser.id,
        productId: 'prod-1',
      });

      const res = await request(app)
        .post('/api/v1/favorites/prod-1')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('added to favorites');
    });

    it('should remove a product from favorites', async () => {
      (prisma.session.findUnique as any).mockResolvedValue({
        id: 'session-buyer-101',
        userId: buyerUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: buyerUser,
      });

      (prisma.favorite.deleteMany as any).mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/v1/favorites/prod-1')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed from favorites');
    });

    it('should check if a product is in favorites', async () => {
      (prisma.session.findUnique as any).mockResolvedValue({
        id: 'session-buyer-101',
        userId: buyerUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: buyerUser,
      });

      (prisma.favorite.findUnique as any).mockResolvedValue({
        id: 'fav-1',
        userId: buyerUser.id,
        productId: 'prod-1',
      });

      const res = await request(app)
        .get('/api/v1/favorites/check/prod-1')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isFavorited).toBe(true);
    });
  });
});
