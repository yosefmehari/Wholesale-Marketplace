import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus, WholesaleUnit, QuotationStatus, OrderStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      quotationRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      quotation: {
        create: vi.fn(),
        update: vi.fn(),
      },
      quotationRevision: {
        create: vi.fn(),
      },
      business: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      businessMembership: {
        findFirst: vi.fn(),
      },
      address: {
        findFirst: vi.fn(),
      },
      inventory: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      order: {
        create: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Quotations & Negotiation Suite (Stage 8)', () => {
  const buyerUser = {
    id: 'user-buyer-301',
    email: 'buyer-addis@enterprise.et',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    fullName: 'Addis Retail Cooperatives',
  };

  const tokens = AuthService.generateTokens(buyerUser, 'session-buyer-301');

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.session.findUnique as any).mockResolvedValue({
      id: 'session-buyer-301',
      userId: buyerUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      user: buyerUser,
    });
  });

  describe('RFQ Creation (POST /api/v1/quotations/rfq)', () => {
    it('should create RFQ with custom line items and initial revision snapshot', async () => {
      (prisma.business.findUnique as any).mockResolvedValue({
        id: 'sup-biz-flour',
        name: 'National Flour Mills PLC',
      });

      (prisma.business.findFirst as any).mockResolvedValue({
        id: 'biz-buyer-coop',
        name: 'Addis Retail Cooperatives',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          quotationRequest: {
            create: vi.fn().mockResolvedValue({
              id: 'rfq-101',
              rfqNumber: 'WH-RFQ-20261017-1001',
              status: QuotationStatus.PENDING_SUPPLIER_REVIEW,
              title: 'Bulk Wheat Flour Procurement (500 Bags)',
            }),
          },
          quotation: {
            create: vi.fn().mockResolvedValue({
              id: 'quote-101',
              versionNumber: 1,
              totalPrice: 2250000,
            }),
          },
          quotationRevision: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/quotations/rfq')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          supplierBusinessId: 'sup-biz-flour',
          title: 'Bulk Wheat Flour Procurement (500 Bags)',
          deliveryLocation: 'Kality Distribution Depot',
          targetPrice: 2200000,
          notes: 'Requires SGS quality inspection certificate',
          items: [
            {
              productName: 'Commercial White Wheat Flour 50kg',
              quantity: 500,
              unit: WholesaleUnit.BAG,
              targetUnitPrice: 4500,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rfqNumber).toBe('WH-RFQ-20261017-1001');
    });

    it('should reject RFQ creation when items array is missing or empty', async () => {
      const res = await request(app)
        .post('/api/v1/quotations/rfq')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          supplierBusinessId: 'sup-biz-flour',
          title: 'No items RFQ',
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('at least one requested item');
    });
  });

  describe('Supplier Formal Quotation (POST /api/v1/quotations/rfqs/:id/quote)', () => {
    it('should submit an updated formal quotation version from the supplier', async () => {
      (prisma.quotationRequest.findUnique as any).mockResolvedValue({
        id: 'rfq-101',
        supplierBusinessId: 'sup-biz-flour',
        status: QuotationStatus.PENDING_SUPPLIER_REVIEW,
        quotations: [{ versionNumber: 1 }],
      });

      (prisma.businessMembership.findFirst as any).mockResolvedValue({
        userId: buyerUser.id,
        businessId: 'sup-biz-flour',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          quotation: {
            create: vi.fn().mockResolvedValue({
              id: 'quote-v2',
              versionNumber: 2,
              status: QuotationStatus.SUBMITTED,
              totalPrice: 2300000,
            }),
          },
          quotationRequest: {
            update: vi.fn().mockResolvedValue({}),
          },
          quotationRevision: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/quotations/rfqs/rfq-101/quote')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          shippingFee: 50000,
          taxFee: 0,
          paymentTerms: '50% upon order confirmation, 50% upon delivery',
          leadTimeDays: 5,
          validDays: 14,
          supplierNotes: 'Includes factory palletizing and transport to Kality',
          items: [
            {
              productName: 'Commercial White Wheat Flour 50kg',
              quantity: 500,
              unit: WholesaleUnit.BAG,
              offeredUnitPrice: 4500,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versionNumber).toBe(2);
      expect(res.body.data.totalPrice).toBe(2300000);
    });
  });

  describe('Buyer Negotiation & Revision (POST /api/v1/quotations/rfqs/:id/request-revision)', () => {
    it('should record revision request and update RFQ status', async () => {
      (prisma.quotationRequest.findUnique as any).mockResolvedValue({
        id: 'rfq-101',
        buyerUserId: buyerUser.id,
        quotations: [{ versionNumber: 2 }],
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          quotationRequest: { update: vi.fn().mockResolvedValue({}) },
          quotationRevision: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/quotations/rfqs/rfq-101/request-revision')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ message: 'Can you include free unloading at warehouse gate 2?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Revision requested');
    });
  });

  describe('Quotation Acceptance & Conversion to Order (POST /api/v1/quotations/rfqs/:id/accept)', () => {
    it('should convert accepted quotation into a binding wholesale purchase order', async () => {
      const validUntilFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      (prisma.quotationRequest.findUnique as any).mockResolvedValue({
        id: 'rfq-101',
        rfqNumber: 'WH-RFQ-20261017-1001',
        buyerBusinessId: 'biz-buyer-coop',
        buyerUserId: buyerUser.id,
        supplierBusinessId: 'sup-biz-flour',
        status: QuotationStatus.SUBMITTED,
        quotations: [
          {
            id: 'quote-v2',
            versionNumber: 2,
            validUntil: validUntilFuture,
            subtotal: 2250000,
            shippingFee: 50000,
            taxFee: 0,
            totalPrice: 2300000,
            items: [
              {
                productId: 'prod-flour-1',
                productName: 'Commercial White Wheat Flour 50kg',
                quantity: 500,
                unit: WholesaleUnit.BAG,
                offeredUnitPrice: 4500,
                lineTotal: 2250000,
              },
            ],
          },
        ],
      });

      (prisma.address.findFirst as any).mockResolvedValue({
        id: 'addr-kality-1',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          inventory: {
            findUnique: vi.fn().mockResolvedValue({ quantity: 1000 }),
            update: vi.fn().mockResolvedValue({}),
          },
          order: {
            create: vi.fn().mockResolvedValue({
              id: 'ord-from-rfq',
              orderNumber: 'WH-ORD-20261017-9901',
              status: OrderStatus.PENDING_CONFIRMATION,
              totalAmount: 2300000,
            }),
          },
          quotation: { update: vi.fn().mockResolvedValue({}) },
          quotationRequest: { update: vi.fn().mockResolvedValue({}) },
          quotationRevision: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/quotations/rfqs/rfq-101/accept')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          shippingAddressId: 'addr-kality-1',
          paymentMethod: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe('WH-ORD-20261017-9901');
      expect(res.body.message).toContain('Wholesale Order #WH-ORD-20261017-9901 has been generated');
    });

    it('should reject accepting an expired quotation', async () => {
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

      (prisma.quotationRequest.findUnique as any).mockResolvedValue({
        id: 'rfq-expired',
        buyerUserId: buyerUser.id,
        status: QuotationStatus.SUBMITTED,
        quotations: [
          {
            id: 'quote-old',
            validUntil: expiredDate,
            items: [],
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/quotations/rfqs/rfq-expired/accept')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('quotation has expired');
    });
  });
});
