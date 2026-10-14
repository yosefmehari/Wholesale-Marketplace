import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus, VerificationStatus, WholesaleUnit, ProductStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      businessMembership: {
        findFirst: vi.fn(),
      },
      product: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      inventory: {
        aggregate: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      priceTier: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      supplierVerificationDocument: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(prisma);
      }),
    },
  };
});

describe('Supplier Portal & Catalog Management Suite (Stage 5)', () => {
  const supplierUser = {
    id: 'user-supp-1',
    email: 'supplier@agro-ethiopia.et',
    role: UserRole.SUPPLIER,
    status: UserStatus.ACTIVE,
    fullName: 'Agro Supplier PLC',
  };

  const supplierBusiness = {
    id: 'bus-supp-1',
    name: 'Addis Agro Industries PLC',
    slug: 'addis-agro-industries-plc',
    city: 'Addis Ababa',
    subCity: 'Akaki Kality',
    isVerified: true,
    supplierProfile: {
      id: 'prof-supp-1',
      businessId: 'bus-supp-1',
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
      minimumOrderAmount: 5000,
    },
  };

  const tokens = AuthService.generateTokens(supplierUser, 'session-supp-123');

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: 'session-supp-123',
      userId: supplierUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60000),
      user: supplierUser,
    } as any);

    vi.mocked(prisma.businessMembership.findFirst).mockResolvedValue({
      id: 'memb-1',
      userId: supplierUser.id,
      businessId: supplierBusiness.id,
      business: supplierBusiness,
    } as any);
  });

  describe('GET /api/v1/supplier/dashboard', () => {
    it('should return operational dashboard metrics for authenticated supplier', async () => {
      vi.mocked(prisma.product.count)
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(10); // published

      vi.mocked(prisma.inventory.aggregate).mockResolvedValueOnce({
        _sum: { quantity: 1500 },
      } as any);

      vi.mocked(prisma.inventory.count).mockResolvedValueOnce(2); // low stock

      const res = await request(app)
        .get('/api/v1/supplier/dashboard')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalProducts).toBe(12);
      expect(res.body.data.stats.totalUnitsInStock).toBe(1500);
      expect(res.body.data.stats.lowStockAlerts).toBe(2);
      expect(res.body.data.supplierProfile.verificationStatus).toBe('APPROVED');
    });
  });

  describe('POST /api/v1/supplier/products', () => {
    it('should create a new wholesale product with tiered pricing and stock inventory', async () => {
      const mockCreatedProduct = {
        id: 'prod-new-1',
        businessId: supplierBusiness.id,
        name: 'Fortified Sunflower Oil 20L',
        wholesaleUnit: WholesaleUnit.CARTON,
        minOrderQuantity: 10,
        status: ProductStatus.PUBLISHED,
        priceTiers: [
          { minQuantity: 10, maxQuantity: 49, unitPrice: 3200 },
          { minQuantity: 50, maxQuantity: null, unitPrice: 3000 },
        ],
      };

      vi.mocked(prisma.product.create).mockResolvedValueOnce(mockCreatedProduct as any);

      const res = await request(app)
        .post('/api/v1/supplier/products')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          name: 'Fortified Sunflower Oil 20L',
          categoryId: 'cat-food-1',
          description: 'High grade commercial cooking oil in heavy-duty jerrycans',
          wholesaleUnit: 'CARTON',
          minOrderQuantity: 10,
          leadTimeDays: 2,
          initialStock: 200,
          priceTiers: [
            { minQuantity: 10, maxQuantity: 49, unitPrice: 3200 },
            { minQuantity: 50, maxQuantity: null, unitPrice: 3000 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Fortified Sunflower Oil 20L');
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('should mark product as PENDING_REVIEW if supplier is unverified (pending)', async () => {
      // Simulate pending supplier
      vi.mocked(prisma.businessMembership.findFirst).mockResolvedValueOnce({
        id: 'memb-pending',
        userId: supplierUser.id,
        businessId: supplierBusiness.id,
        business: {
          ...supplierBusiness,
          supplierProfile: {
            ...supplierBusiness.supplierProfile,
            verificationStatus: VerificationStatus.PENDING,
          },
        },
      } as any);

      vi.mocked(prisma.product.create).mockImplementationOnce((args: any) => {
        expect(args.data.status).toBe(ProductStatus.PENDING_REVIEW);
        return Promise.resolve({ id: 'prod-pending-1', status: ProductStatus.PENDING_REVIEW } as any);
      });

      const res = await request(app)
        .post('/api/v1/supplier/products')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          name: 'Pending Product Test',
          categoryId: 'cat-food-1',
          description: 'Product created prior to verification review',
          wholesaleUnit: 'CARTON',
          minOrderQuantity: 5,
          leadTimeDays: 1,
          initialStock: 50,
          priceTiers: [{ minQuantity: 5, maxQuantity: null, unitPrice: 500 }],
        });

      expect(res.status).toBe(201);
    });

    it('should reject product creation if no price tiers are provided', async () => {
      const res = await request(app)
        .post('/api/v1/supplier/products')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          name: 'Invalid Product Without Tiers',
          categoryId: 'cat-food-1',
          description: 'Description test',
          wholesaleUnit: 'CARTON',
          minOrderQuantity: 5,
          priceTiers: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation error');
    });
  });

  describe('PATCH /api/v1/supplier/inventory/:productId', () => {
    it('should update stock inventory level for a supplier owned product', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValueOnce({
        id: 'prod-own-1',
        businessId: supplierBusiness.id,
      } as any);

      vi.mocked(prisma.inventory.upsert).mockResolvedValueOnce({
        productId: 'prod-own-1',
        quantity: 350,
        reorderThreshold: 15,
        lowStockAlert: false,
      } as any);

      const res = await request(app)
        .patch('/api/v1/supplier/inventory/prod-own-1')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          quantity: 350,
          reorderThreshold: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(350);
    });

    it('should reject stock update if product belongs to another supplier (ownership check)', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/v1/supplier/inventory/prod-other-supplier')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          quantity: 100,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found in your inventory');
    });
  });

  describe('POST /api/v1/supplier/verification', () => {
    it('should submit verification documents for review', async () => {
      vi.mocked(prisma.supplierVerificationDocument.create).mockResolvedValueOnce({
        id: 'doc-1',
        supplierProfileId: supplierBusiness.supplierProfile.id,
        documentType: 'BUSINESS_LICENSE',
        fileName: 'trade-license.pdf',
        status: VerificationStatus.PENDING,
      } as any);

      const res = await request(app)
        .post('/api/v1/supplier/verification')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          documentType: 'BUSINESS_LICENSE',
          fileName: 'trade-license.pdf',
          fileUrl: 'https://storage.wholesalehub.et/private/trade-license.pdf',
          fileSize: 1048576,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
    });
  });
});
