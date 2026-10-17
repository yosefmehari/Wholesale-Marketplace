import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getInvoiceByOrder = async (
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: true,
        items: true,
        supplierBusiness: true,
        buyerBusiness: true,
        buyerUser: true,
        shippingAddress: true,
        payments: {
          where: { status: 'COMPLETED' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify authorization
    const isBuyer = order.buyerUserId === userId;
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: order.supplierBusinessId },
    });
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isBuyer && !isSupplier && !isAdmin) {
      throw new AppError('Not authorized to access invoice for this order', 403);
    }

    let invoice = order.invoice;

    // If invoice does not yet exist, create it on-demand
    if (!invoice) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const invoiceNumber = `WH-INV-${dateStr}-${order.orderNumber.slice(-4)}-${randomSuffix}`;

      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          invoiceNumber,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          currency: 'ETB',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        invoice,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          currency: order.currency,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          shippingAmount: order.shippingAmount,
          totalAmount: order.totalAmount,
          status: order.status,
        },
        supplier: {
          name: order.supplierBusiness.name,
          tinNumber: order.supplierBusiness.tinNumber || 'TIN-NOT-RECORDED',
          registrationNumber: order.supplierBusiness.registrationNumber || 'REG-NOT-RECORDED',
          email: order.supplierBusiness.email,
          phone: order.supplierBusiness.phone,
          addressLine: order.supplierBusiness.addressLine,
          city: order.supplierBusiness.city,
          subCity: order.supplierBusiness.subCity,
        },
        buyer: {
          name: order.buyerBusiness?.name || order.buyerUser.fullName,
          tinNumber: order.buyerBusiness?.tinNumber || null,
          email: order.buyerBusiness?.email || order.buyerUser.email,
          phone: order.buyerBusiness?.phone || order.buyerUser.phone,
          address: order.shippingAddress,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          wholesaleUnit: item.wholesaleUnit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        payment: order.payments[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
