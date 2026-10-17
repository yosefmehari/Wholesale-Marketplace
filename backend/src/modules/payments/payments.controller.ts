import { Request, Response, NextFunction } from 'express';
import { PaymentMethod, PaymentStatus, OrderStatus, SettlementStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { telebirrAdapter } from './adapters/telebirr.adapter';
import { bankTransferAdapter, SUPPORTED_ETHIOPIAN_BANKS } from './adapters/bank-transfer.adapter';

function generatePaymentNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WH-PAY-${dateStr}-${randomSuffix}`;
}

function generateInvoiceNumber(orderNumber: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `WH-INV-${dateStr}-${orderNumber.slice(-4)}-${randomSuffix}`;
}

function generateSettlementNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WH-SET-${dateStr}-${randomSuffix}`;
}

export const initiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { orderId, paymentMethod = PaymentMethod.BANK_TRANSFER } = req.body;

    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: { status: { in: [PaymentStatus.COMPLETED, PaymentStatus.SUBMITTED_FOR_VERIFICATION] } },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.buyerUserId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Not authorized to pay for this order', 403);
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED) {
      throw new AppError(`Cannot initiate payment for an order in status "${order.status}"`, 400);
    }

    // Check if order already has a completed payment
    const existingCompleted = order.payments.find((p) => p.status === PaymentStatus.COMPLETED);
    if (existingCompleted) {
      throw new AppError('This order has already been paid for in full', 400);
    }

    const paymentNumber = generatePaymentNumber();
    const amount = Number(order.totalAmount);

    let paymentUrl: string | undefined;
    let paymentInstructions: any;

    if (paymentMethod === PaymentMethod.TELEBIRR) {
      const telebirrRes = await telebirrAdapter.initiatePayment({
        outTradeNo: paymentNumber,
        subject: `WholesaleHub Order ${order.orderNumber}`,
        totalAmount: amount,
      });
      paymentUrl = telebirrRes.toPayUrl;
    } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
      paymentInstructions = {
        accounts: SUPPORTED_ETHIOPIAN_BANKS,
        referenceInstruction: `Include "${order.orderNumber}" in your transfer reference/memo and submit the transaction code.`,
      };
    }

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          orderId,
          paymentNumber,
          paymentMethod: paymentMethod as PaymentMethod,
          status: PaymentStatus.PENDING,
          amount,
          currency: 'ETB',
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: createdPayment.id,
          eventType: 'PAYMENT_INITIATED',
          payload: {
            paymentMethod,
            amount,
            currency: 'ETB',
            initiatedBy: userId,
          },
        },
      });

      return createdPayment;
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        paymentUrl,
        instructions: paymentInstructions,
      },
      message: 'Payment session initiated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const submitPaymentProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { paymentId, transactionReference, notes } = req.body;

    if (!paymentId || !transactionReference) {
      throw new AppError('Payment ID and transaction reference are required', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    if (payment.order.buyerUserId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Not authorized to submit proof for this payment', 403);
    }

    if (!bankTransferAdapter.validateReference(transactionReference)) {
      throw new AppError('Please provide a valid bank wire transfer reference number (min 5 chars)', 400);
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          transactionReference: transactionReference.trim(),
          status: PaymentStatus.SUBMITTED_FOR_VERIFICATION,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId,
          eventType: 'PROOF_SUBMITTED',
          payload: {
            transactionReference,
            notes,
            submittedAt: new Date(),
          },
        },
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment proof submitted for supplier/admin verification',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            supplierBusiness: {
              include: { supplierProfile: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: payment.order.supplierBusinessId },
    });
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isSupplier && !isAdmin) {
      throw new AppError('Only the supplier or administrator can verify this payment', 403);
    }

    // Process verification in an atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark payment COMPLETED
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.COMPLETED,
          verifiedByUserId: userId,
          verifiedAt: new Date(),
        },
      });

      // 2. Advance Order status to CONFIRMED if it was PENDING_CONFIRMATION
      let updatedOrder = payment.order;
      if (payment.order.status === OrderStatus.PENDING_CONFIRMATION) {
        updatedOrder = (await tx.order.update({
          where: { id: payment.order.id },
          data: { status: OrderStatus.CONFIRMED },
          include: {
            supplierBusiness: { include: { supplierProfile: true } },
          },
        })) as any;

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            previousStatus: OrderStatus.PENDING_CONFIRMATION,
            newStatus: OrderStatus.CONFIRMED,
            changedById: userId,
            notes: `Payment verified (${payment.paymentMethod} - Ref: ${payment.transactionReference || 'N/A'}). Order automatically confirmed.`,
          },
        });
      }

      // 3. Generate Commercial / VAT Invoice if not already present
      let invoice = await tx.invoice.findUnique({
        where: { orderId: payment.orderId },
      });

      if (!invoice) {
        const invoiceNum = generateInvoiceNumber(payment.order.orderNumber);
        invoice = await tx.invoice.create({
          data: {
            orderId: payment.orderId,
            invoiceNumber: invoiceNum,
            subtotal: payment.order.subtotal,
            taxAmount: payment.order.taxAmount,
            totalAmount: payment.order.totalAmount,
            currency: 'ETB',
          },
        });
      }

      // 4. Calculate Platform Commission & Create SupplierSettlement record
      const supplierProfile = payment.order.supplierBusiness?.supplierProfile;
      let settlement = await tx.supplierSettlement.findUnique({
        where: { orderId: payment.orderId },
      });

      if (!settlement && supplierProfile) {
        const commissionRate = 0.0300; // 3% wholesale marketplace commission
        const grossAmount = Number(payment.order.subtotal);
        const commissionAmount = Math.round(grossAmount * commissionRate * 100) / 100;
        const netPayoutAmount = Number(payment.order.totalAmount) - commissionAmount;
        const settlementNum = generateSettlementNumber();

        settlement = await tx.supplierSettlement.create({
          data: {
            settlementNumber: settlementNum,
            supplierProfileId: supplierProfile.id,
            orderId: payment.orderId,
            grossOrderAmount: grossAmount,
            commissionRate,
            commissionAmount,
            netPayoutAmount,
            status: SettlementStatus.PENDING,
          },
        });
      }

      // 5. Record Payment Event
      await tx.paymentEvent.create({
        data: {
          paymentId: id,
          eventType: 'PAYMENT_VERIFIED',
          payload: {
            verifiedBy: userId,
            verifiedAt: new Date(),
          },
        },
      });

      return { payment: updatedPayment, invoice, settlement, order: updatedOrder };
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Payment verified successfully! Invoice generated and order confirmed.',
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { orderId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const telebirrWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { outTradeNo, sign, ...payload } = req.body;

    if (!outTradeNo) {
      res.status(400).json({ message: 'outTradeNo required' });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { paymentNumber: outTradeNo },
      include: { order: true },
    });

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    // Verify webhook signature
    const isValidSign = telebirrAdapter.verifyCallbackSignature(payload, sign || '');
    if (!isValidSign && process.env.NODE_ENV === 'production') {
      res.status(400).json({ message: 'Invalid callback signature' });
      return;
    }

    // Update payment to COMPLETED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        transactionReference: payload.transactionNo || 'TELEBIRR-TX-WEBHOOK',
        verifiedAt: new Date(),
      },
    });

    res.status(200).json({ code: 0, message: 'success' });
  } catch (error) {
    next(error);
  }
};
