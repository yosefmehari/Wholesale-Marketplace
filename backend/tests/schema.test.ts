import { describe, it, expect } from 'vitest';
import {
  UserRole,
  UserStatus,
  BusinessType,
  VerificationStatus,
  WholesaleUnit,
  OrderStatus,
  QuotationStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
} from '@prisma/client';

describe('Prisma Schema & Domain Model Integrity Tests', () => {
  it('should have all expected role and user status enums defined', () => {
    expect(UserRole.GUEST).toBe('GUEST');
    expect(UserRole.BUYER).toBe('BUYER');
    expect(UserRole.SUPPLIER).toBe('SUPPLIER');
    expect(UserRole.ADMIN).toBe('ADMIN');

    expect(UserStatus.ACTIVE).toBe('ACTIVE');
    expect(UserStatus.SUSPENDED).toBe('SUSPENDED');
  });

  it('should have all Ethiopian wholesale business types defined', () => {
    expect(BusinessType.MANUFACTURER).toBe('MANUFACTURER');
    expect(BusinessType.IMPORTER).toBe('IMPORTER');
    expect(BusinessType.DISTRIBUTOR).toBe('DISTRIBUTOR');
    expect(BusinessType.WHOLESALER).toBe('WHOLESALER');
    expect(BusinessType.RETAILER).toBe('RETAILER');
  });

  it('should define accurate wholesale units for trade packaging', () => {
    expect(WholesaleUnit.CARTON).toBe('CARTON');
    expect(WholesaleUnit.BOX).toBe('BOX');
    expect(WholesaleUnit.BAG).toBe('BAG');
    expect(WholesaleUnit.KILOGRAM).toBe('KILOGRAM');
    expect(WholesaleUnit.LITER).toBe('LITER');
  });

  it('should define standard order lifecycle statuses', () => {
    expect(OrderStatus.PENDING_CONFIRMATION).toBe('PENDING_CONFIRMATION');
    expect(OrderStatus.CONFIRMED).toBe('CONFIRMED');
    expect(OrderStatus.PROCESSING).toBe('PROCESSING');
    expect(OrderStatus.READY_FOR_DISPATCH).toBe('READY_FOR_DISPATCH');
    expect(OrderStatus.SHIPPED).toBe('SHIPPED');
    expect(OrderStatus.DELIVERED).toBe('DELIVERED');
    expect(OrderStatus.CANCELLED).toBe('CANCELLED');
    expect(OrderStatus.REJECTED).toBe('REJECTED');
  });

  it('should define formal RFQ quotation negotiation statuses', () => {
    expect(QuotationStatus.PENDING_SUPPLIER_REVIEW).toBe('PENDING_SUPPLIER_REVIEW');
    expect(QuotationStatus.SUBMITTED).toBe('SUBMITTED');
    expect(QuotationStatus.BUYER_REVISION_REQUESTED).toBe('BUYER_REVISION_REQUESTED');
    expect(QuotationStatus.ACCEPTED).toBe('ACCEPTED');
    expect(QuotationStatus.DECLINED).toBe('DECLINED');
    expect(QuotationStatus.CONVERTED_TO_ORDER).toBe('CONVERTED_TO_ORDER');
  });

  it('should support Ethiopian payment methods including Telebirr and CBE Birr', () => {
    expect(PaymentMethod.TELEBIRR).toBe('TELEBIRR');
    expect(PaymentMethod.CBE_BIRR).toBe('CBE_BIRR');
    expect(PaymentMethod.BANK_TRANSFER).toBe('BANK_TRANSFER');
    expect(PaymentMethod.CASH_ON_DELIVERY).toBe('CASH_ON_DELIVERY');
  });

  it('should instantiate PrismaClient with expected model delegates', () => {
    const client = new PrismaClient();
    expect(client.user).toBeDefined();
    expect(client.business).toBeDefined();
    expect(client.supplierProfile).toBeDefined();
    expect(client.category).toBeDefined();
    expect(client.product).toBeDefined();
    expect(client.priceTier).toBeDefined();
    expect(client.inventory).toBeDefined();
    expect(client.order).toBeDefined();
    expect(client.orderItem).toBeDefined();
    expect(client.quotationRequest).toBeDefined();
    expect(client.quotation).toBeDefined();
    expect(client.payment).toBeDefined();
    expect(client.invoice).toBeDefined();
    expect(client.shipment).toBeDefined();
    expect(client.conversation).toBeDefined();
    expect(client.review).toBeDefined();
    expect(client.auditLog).toBeDefined();
    expect(client.platformSetting).toBeDefined();
  });
});
