import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus, PaymentMethod, PaymentStatus, OrderStatus, SettlementStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/auth.service';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      paymentEvent: {
        create: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      invoice: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      supplierSettlement: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        update: vi.fn(),
      },
      businessMembership: {
        findFirst: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Payments, Invoices & Commissions Suite (Stage 9)', () => {
  const buyerUser = {
    id: 'user-buyer-401',
    email: 'buyer-mercato@traders.et',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
    fullName: 'Mercato Bulk Distributors',
  };

  const tokens = AuthService.generateTokens(buyerUser, 'session-buyer-401');

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.session.findUnique as any).mockResolvedValue({
      id: 'session-buyer-401',
      userId: buyerUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      user: buyerUser,
    });
  });

  describe('Payment Initiation (POST /api/v1/payments/initiate)', () => {
    it('should initiate bank transfer payment and provide deposit accounts', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'ord-pay-1',
        orderNumber: 'WH-ORD-20261017-1001',
        buyerUserId: buyerUser.id,
        totalAmount: 150000,
        status: OrderStatus.PENDING_CONFIRMATION,
        payments: [],
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'pay-1',
              paymentNumber: 'WH-PAY-20261017-5501',
              paymentMethod: PaymentMethod.BANK_TRANSFER,
              amount: 150000,
              status: PaymentStatus.PENDING,
            }),
          },
          paymentEvent: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          orderId: 'ord-pay-1',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.paymentNumber).toBe('WH-PAY-20261017-5501');
      expect(res.body.data.instructions.accounts).toBeDefined();
      expect(res.body.data.instructions.accounts.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Proof Submission (POST /api/v1/payments/submit-proof)', () => {
    it('should submit bank slip reference and update status to SUBMITTED_FOR_VERIFICATION', async () => {
      (prisma.payment.findUnique as any).mockResolvedValue({
        id: 'pay-1',
        order: { buyerUserId: buyerUser.id },
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          payment: {
            update: vi.fn().mockResolvedValue({
              id: 'pay-1',
              status: PaymentStatus.SUBMITTED_FOR_VERIFICATION,
              transactionReference: 'CBE-FT-88990011',
            }),
          },
          paymentEvent: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/payments/submit-proof')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          paymentId: 'pay-1',
          transactionReference: 'CBE-FT-88990011',
          notes: 'Paid via CBE Birr app to main account',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PaymentStatus.SUBMITTED_FOR_VERIFICATION);
      expect(res.body.data.transactionReference).toBe('CBE-FT-88990011');
    });
  });

  describe('Payment Verification & Automatic Invoicing (POST /api/v1/payments/:id/verify)', () => {
    it('should verify payment, confirm order, create invoice, and calculate supplier settlement', async () => {
      const mockOrder = {
        id: 'ord-pay-1',
        orderNumber: 'WH-ORD-20261017-1001',
        supplierBusinessId: 'sup-biz-1',
        buyerUserId: buyerUser.id,
        subtotal: 150000,
        taxAmount: 0,
        totalAmount: 150000,
        status: OrderStatus.PENDING_CONFIRMATION,
        supplierBusiness: {
          supplierProfile: { id: 'sup-profile-1' },
        },
      };

      (prisma.payment.findUnique as any).mockResolvedValue({
        id: 'pay-1',
        orderId: 'ord-pay-1',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        transactionReference: 'CBE-FT-88990011',
        order: mockOrder,
      });

      (prisma.businessMembership.findFirst as any).mockResolvedValue({
        userId: buyerUser.id,
        businessId: 'sup-biz-1',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          payment: {
            update: vi.fn().mockResolvedValue({
              id: 'pay-1',
              status: PaymentStatus.COMPLETED,
            }),
          },
          order: {
            update: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.CONFIRMED,
            }),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
          invoice: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: 'inv-1',
              invoiceNumber: 'WH-INV-20261017-1001-441',
              totalAmount: 150000,
            }),
          },
          supplierSettlement: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: 'set-1',
              settlementNumber: 'WH-SET-20261017-9001',
              grossOrderAmount: 150000,
              commissionRate: 0.03,
              commissionAmount: 4500,
              netPayoutAmount: 145500,
              status: SettlementStatus.PENDING,
            }),
          },
          paymentEvent: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/payments/pay-1/verify')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe(PaymentStatus.COMPLETED);
      expect(res.body.data.invoice.invoiceNumber).toBe('WH-INV-20261017-1001-441');
      // 3% of 150,000 = 4,500 ETB commission; 145,500 ETB net payout
      expect(res.body.data.settlement.commissionAmount).toBe(4500);
      expect(res.body.data.settlement.netPayoutAmount).toBe(145500);
    });
  });

  describe('Invoice Access (GET /api/v1/invoices/:orderId)', () => {
    it('should generate or return formal invoice with seller TIN and buyer details', async () => {
      const mockOrder = {
        id: 'ord-pay-1',
        orderNumber: 'WH-ORD-20261017-1001',
        buyerUserId: buyerUser.id,
        supplierBusinessId: 'sup-biz-1',
        createdAt: new Date(),
        currency: 'ETB',
        subtotal: 150000,
        taxAmount: 0,
        shippingAmount: 0,
        totalAmount: 150000,
        status: OrderStatus.CONFIRMED,
        invoice: {
          id: 'inv-1',
          invoiceNumber: 'WH-INV-20261017-1001-441',
          totalAmount: 150000,
        },
        items: [
          {
            id: 'item-1',
            productName: 'Edible Cooking Oil 20L',
            productSku: 'OIL-20L',
            wholesaleUnit: 'CARTON',
            quantity: 50,
            unitPrice: 3000,
            totalPrice: 150000,
          },
        ],
        supplierBusiness: {
          name: 'Habesha Edible Oil PLC',
          tinNumber: '0012345678',
          registrationNumber: 'AA/01/2014',
          email: 'sales@habeshaoil.et',
          phone: '+251911445566',
          addressLine: 'Akaki Kaliti Industrial Zone',
          city: 'Addis Ababa',
          subCity: 'Akaky Kaliti',
        },
        buyerBusiness: {
          name: 'Mercato Bulk Distributors',
          tinNumber: '0087654321',
          email: 'procurement@mercatobulk.et',
          phone: '+251922334455',
        },
        buyerUser: buyerUser,
        shippingAddress: {
          recipientName: 'Mercato Depot Gate 3',
          phoneNumber: '+251922334455',
          city: 'Addis Ababa',
          subCity: 'Addis Ketema',
        },
        payments: [],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      const res = await request(app)
        .get('/api/v1/invoices/ord-pay-1')
        .set('Authorization', `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.invoiceNumber).toBe('WH-INV-20261017-1001-441');
      expect(res.body.data.supplier.tinNumber).toBe('0012345678');
      expect(res.body.data.items).toHaveLength(1);
    });
  });
});
