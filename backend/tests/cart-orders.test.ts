import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus, WholesaleUnit, ProductStatus, OrderStatus, BusinessType } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      cart: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      cartItem: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
      inventory: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      address: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      business: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      businessMembership: {
        findFirst: vi.fn(),
      },
      order: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Cart & Multi-Supplier Orders Suite (Stage 7)', () => {
  const buyerUser = {
    id: 'user-buyer-201',
    email: 'buyer-kera@retailer.et',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    fullName: 'Kera Wholesale Traders',
  };

  const tokens = AuthService.generateTokens(buyerUser, 'session-buyer-201');

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.session.findUnique as any).mockResolvedValue({
      id: 'session-buyer-201',
      userId: buyerUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      user: buyerUser,
    });
  });

  describe('Cart Operations (/api/v1/cart)', () => {
    it('should calculate tiered prices and group items by supplier', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: buyerUser.id,
        items: [
          {
            id: 'item-1',
            productId: 'prod-teff',
            quantity: 25,
            product: {
              id: 'prod-teff',
              name: 'Magna Teff Grade 1',
              slug: 'magna-teff-grade-1',
              wholesaleUnit: WholesaleUnit.BAG,
              minOrderQuantity: 10,
              status: ProductStatus.PUBLISHED,
              images: [{ url: 'https://cdn.wholesalehub.et/teff.jpg', isPrimary: true }],
              inventory: { quantity: 100, lowStockAlert: false },
              business: {
                id: 'sup-grain-plc',
                name: 'Addis Grain Union',
                slug: 'addis-grain-union',
                city: 'Addis Ababa',
                subCity: 'Addis Ketema',
                isVerified: true,
              },
              priceTiers: [
                { minQuantity: 10, maxQuantity: 19, unitPrice: 4800 },
                { minQuantity: 20, maxQuantity: 49, unitPrice: 4500 },
                { minQuantity: 50, maxQuantity: null, unitPrice: 4200 },
              ],
            },
          },
        ],
      };

      (prisma.cart.findUnique as any).mockResolvedValue(mockCart);

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalItems).toBe(25);
      // For quantity 25, tier [20-49] price is 4500 ETB
      expect(res.body.data.items[0].unitPrice).toBe(4500);
      expect(res.body.data.items[0].totalPrice).toBe(4500 * 25);
      expect(res.body.data.subtotal).toBe(4500 * 25);
      expect(res.body.data.supplierGroups).toHaveLength(1);
      expect(res.body.data.supplierGroups[0].supplier.name).toBe('Addis Grain Union');
    });

    it('should reject adding items when quantity exceeds available inventory', async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-oil',
        name: 'Sunflower Cooking Oil 20L',
        status: ProductStatus.PUBLISHED,
        inventory: { quantity: 15 },
        priceTiers: [{ minQuantity: 5, unitPrice: 2200 }],
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ productId: 'prod-oil', quantity: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds available stock');
    });

    it('should successfully add valid item to cart', async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: 'prod-oil',
        name: 'Sunflower Cooking Oil 20L',
        status: ProductStatus.PUBLISHED,
        inventory: { quantity: 50 },
        priceTiers: [{ minQuantity: 5, unitPrice: 2200 }],
      });

      (prisma.cart.findUnique as any).mockResolvedValue({ id: 'cart-1', userId: buyerUser.id });
      (prisma.cartItem.findUnique as any).mockResolvedValue(null);
      (prisma.cartItem.upsert as any).mockResolvedValue({
        id: 'item-2',
        cartId: 'cart-1',
        productId: 'prod-oil',
        quantity: 10,
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ productId: 'prod-oil', quantity: 10 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(10);
    });
  });

  describe('Multi-Supplier Checkout & Order Creation (/api/v1/orders/checkout)', () => {
    it('should partition multi-supplier cart into separate orders and atomically deduct stock in transaction', async () => {
      const mockCartWithTwoSuppliers = {
        id: 'cart-1',
        userId: buyerUser.id,
        items: [
          {
            id: 'item-teff',
            productId: 'prod-teff',
            quantity: 20,
            product: {
              id: 'prod-teff',
              businessId: 'sup-grain-1',
              name: 'Teff Flour',
              sku: 'TEFF-01',
              wholesaleUnit: WholesaleUnit.BAG,
              minOrderQuantity: 10,
              status: ProductStatus.PUBLISHED,
              inventory: { quantity: 100 },
              priceTiers: [{ minQuantity: 10, unitPrice: 4500 }],
            },
          },
          {
            id: 'item-coffee',
            productId: 'prod-coffee',
            quantity: 15,
            product: {
              id: 'prod-coffee',
              businessId: 'sup-coffee-2',
              name: 'Sidama Green Coffee',
              sku: 'COF-SID-02',
              wholesaleUnit: WholesaleUnit.BAG,
              minOrderQuantity: 5,
              status: ProductStatus.PUBLISHED,
              inventory: { quantity: 80 },
              priceTiers: [{ minQuantity: 5, unitPrice: 8500 }],
            },
          },
        ],
      };

      (prisma.address.findFirst as any).mockResolvedValue({
        id: 'addr-kera-1',
        recipientName: 'Kera Market Depot',
        subCity: 'Kirkos',
      });

      (prisma.business.findFirst as any).mockResolvedValue({
        id: 'biz-buyer-1',
        name: 'Kera Wholesale Traders',
      });

      (prisma.cart.findUnique as any).mockResolvedValue(mockCartWithTwoSuppliers);

      // Mock interactive transaction callback
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          inventory: {
            findUnique: vi.fn().mockImplementation(({ where }) => {
              if (where.productId === 'prod-teff') return Promise.resolve({ quantity: 100 });
              if (where.productId === 'prod-coffee') return Promise.resolve({ quantity: 80 });
              return Promise.resolve(null);
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
              id: `ord-${data.supplierBusinessId}`,
              orderNumber: data.orderNumber,
              supplierBusinessId: data.supplierBusinessId,
              status: data.status,
              totalAmount: data.totalAmount,
            })),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
          cartItem: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          shippingAddressId: 'addr-kera-1',
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Deliver to warehouse bay 4',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // 2 independent supplier orders must be generated
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].supplierBusinessId).toBe('sup-grain-1');
      expect(res.body.data[1].supplierBusinessId).toBe('sup-coffee-2');
    });
  });

  describe('Order Cancellation & Stock Restoration (/api/v1/orders/:id/cancel)', () => {
    it('should restore inventory when buyer cancels a PENDING_CONFIRMATION order', async () => {
      const mockOrder = {
        id: 'ord-123',
        buyerUserId: buyerUser.id,
        supplierBusinessId: 'sup-grain-1',
        status: OrderStatus.PENDING_CONFIRMATION,
        items: [
          { productId: 'prod-teff', quantity: 20 },
        ],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          inventory: {
            update: vi.fn().mockResolvedValue({}),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CANCELLED,
            }),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .patch('/api/v1/orders/ord-123/cancel')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ reason: 'Changed procurement schedule' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.CANCELLED);
      expect(res.body.message).toContain('stock restored');
    });

    it('should prevent buyer from cancelling a SHIPPED order', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'ord-shipped',
        buyerUserId: buyerUser.id,
        supplierBusinessId: 'sup-grain-1',
        status: OrderStatus.SHIPPED,
        items: [],
      });

      const res = await request(app)
        .patch('/api/v1/orders/ord-shipped/cancel')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ reason: 'Try cancel' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('cannot be self-cancelled');
    });
  });

  describe('Order Lifecycle & Status Transitions (/api/v1/orders/:id/status)', () => {
    it('should reject invalid skip transitions (e.g. PENDING_CONFIRMATION directly to DELIVERED)', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'ord-pending',
        supplierBusinessId: 'sup-biz-101',
        status: OrderStatus.PENDING_CONFIRMATION,
        items: [],
      });

      (prisma.businessMembership.findFirst as any).mockResolvedValue({
        userId: buyerUser.id,
        businessId: 'sup-biz-101',
      });

      const res = await request(app)
        .patch('/api/v1/orders/ord-pending/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ status: OrderStatus.DELIVERED });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid status transition');
    });

    it('should accept valid transition from PENDING_CONFIRMATION to CONFIRMED', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'ord-pending',
        supplierBusinessId: 'sup-biz-101',
        status: OrderStatus.PENDING_CONFIRMATION,
        items: [],
      });

      (prisma.businessMembership.findFirst as any).mockResolvedValue({
        userId: buyerUser.id,
        businessId: 'sup-biz-101',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            update: vi.fn().mockResolvedValue({
              id: 'ord-pending',
              status: OrderStatus.CONFIRMED,
            }),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .patch('/api/v1/orders/ord-pending/status')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ status: OrderStatus.CONFIRMED, notes: 'Supplier confirmed availability' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(OrderStatus.CONFIRMED);
    });
  });
});
