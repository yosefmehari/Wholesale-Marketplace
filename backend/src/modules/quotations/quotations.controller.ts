import { Request, Response, NextFunction } from 'express';
import { QuotationStatus, WholesaleUnit, BusinessType, BusinessMemberRole, OrderStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

function generateRfqNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WH-RFQ-${dateStr}-${randomSuffix}`;
}

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WH-ORD-${dateStr}-${randomSuffix}`;
}

export const createRfq = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const {
      supplierBusinessId,
      title,
      deliveryLocation = 'Addis Ababa',
      targetDeliveryDate,
      targetPrice,
      notes,
      expiresInDays = 14,
      items,
    } = req.body;

    if (!supplierBusinessId || !title || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('supplierBusinessId, title, and at least one requested item are required', 400);
    }

    // Verify supplier business exists
    const supplier = await prisma.business.findUnique({
      where: { id: supplierBusinessId },
    });
    if (!supplier) {
      throw new AppError('Supplier business not found', 404);
    }

    // Resolve buyer business
    let buyerBusiness = await prisma.business.findFirst({
      where: {
        memberships: {
          some: { userId },
        },
      },
    });

    if (!buyerBusiness) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const slug = `buyer-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;
      buyerBusiness = await prisma.business.create({
        data: {
          name: user?.fullName ? `${user.fullName} Commercial` : 'Commercial Buyer',
          slug,
          businessType: BusinessType.RETAILER,
          email: user?.email || 'buyer@wholesalehub.et',
          phone: user?.phone || '+251911000000',
          addressLine: 'Addis Ababa, Ethiopia',
          city: 'Addis Ababa',
          isVerified: false,
          memberships: {
            create: {
              userId,
              role: BusinessMemberRole.OWNER,
            },
          },
        },
      });
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const rfqNumber = generateRfqNumber();

    const rfq = await prisma.$transaction(async (tx) => {
      const createdRfq = await tx.quotationRequest.create({
        data: {
          rfqNumber,
          buyerBusinessId: buyerBusiness.id,
          buyerUserId: userId,
          supplierBusinessId,
          status: QuotationStatus.PENDING_SUPPLIER_REVIEW,
          title,
          deliveryLocation,
          targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          notes,
          expiresAt,
        },
      });

      // Create initial quotation draft placeholder with requested items
      const initialTotal = items.reduce(
        (sum: number, it: any) => sum + (parseFloat(it.targetUnitPrice || 0) * parseInt(it.quantity || 1, 10)),
        0
      );

      const quotation = await tx.quotation.create({
        data: {
          quotationRequestId: createdRfq.id,
          versionNumber: 1,
          status: QuotationStatus.PENDING_SUPPLIER_REVIEW,
          subtotal: initialTotal,
          totalPrice: initialTotal,
          validUntil: expiresAt,
          submittedById: userId,
          supplierNotes: 'Initial buyer RFQ request specifications',
          items: {
            create: items.map((it: any) => ({
              productId: it.productId || null,
              productName: it.productName,
              quantity: parseInt(it.quantity, 10),
              unit: (it.unit as WholesaleUnit) || WholesaleUnit.CARTON,
              offeredUnitPrice: parseFloat(it.targetUnitPrice || 0),
              lineTotal: parseFloat(it.targetUnitPrice || 0) * parseInt(it.quantity, 10),
              notes: it.notes || null,
            })),
          },
        },
        include: { items: true },
      });

      // Record first revision entry
      await tx.quotationRevision.create({
        data: {
          quotationRequestId: createdRfq.id,
          versionNumber: 1,
          actorId: userId,
          action: 'RFQ_CREATED',
          snapshotData: {
            rfqNumber,
            title,
            items,
            targetPrice,
            notes,
          },
          message: notes || 'RFQ initiated by buyer',
        },
      });

      return { ...createdRfq, quotations: [quotation] };
    });

    res.status(201).json({
      success: true,
      data: rfq,
      message: 'Quotation request (RFQ) submitted to supplier successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getRfqs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { role = 'buyer', status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (role === 'supplier') {
      const membership = await prisma.businessMembership.findFirst({
        where: { userId },
      });
      if (!membership) {
        res.status(200).json({
          success: true,
          data: { rfqs: [], pagination: { page: pageNum, limit: limitNum, totalCount: 0, totalPages: 0 } },
        });
        return;
      }
      where.supplierBusinessId = membership.businessId;
    } else {
      where.buyerUserId = userId;
    }

    if (status && status !== 'ALL') {
      where.status = status as QuotationStatus;
    }

    const [rfqs, totalCount] = await Promise.all([
      prisma.quotationRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          buyerBusiness: { select: { id: true, name: true, city: true, subCity: true } },
          supplierBusiness: { select: { id: true, name: true, city: true, subCity: true, isVerified: true } },
          quotations: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: { items: true },
          },
        },
      }),
      prisma.quotationRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        rfqs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRfqDetails = async (
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

    const rfq = await prisma.quotationRequest.findFirst({
      where: {
        OR: [{ id }, { rfqNumber: id }],
      },
      include: {
        buyerBusiness: true,
        buyerUser: { select: { id: true, fullName: true, email: true, phone: true } },
        supplierBusiness: true,
        quotations: {
          orderBy: { versionNumber: 'desc' },
          include: { items: true },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!rfq) {
      throw new AppError('Quotation request not found', 404);
    }

    // Authorization: User must be buyer, member of supplier, or admin
    const isAdmin = req.user?.role === 'ADMIN';
    const isBuyer = rfq.buyerUserId === userId;
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: rfq.supplierBusinessId },
    });

    if (!isAdmin && !isBuyer && !isSupplier) {
      throw new AppError('Not authorized to view this RFQ', 403);
    }

    res.status(200).json({
      success: true,
      data: rfq,
    });
  } catch (error) {
    next(error);
  }
};

export const submitSupplierQuote = async (
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
    const {
      items,
      shippingFee = 0,
      taxFee = 0,
      paymentTerms = 'Direct bank transfer within 7 business days',
      leadTimeDays = 3,
      validDays = 10,
      supplierNotes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Quotation items with offered unit prices are required', 400);
    }

    const rfq = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Verify supplier membership
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: rfq.supplierBusinessId },
    });
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isSupplier && !isAdmin) {
      throw new AppError('Only the assigned supplier can submit a formal quotation', 403);
    }

    if (rfq.status === QuotationStatus.ACCEPTED || rfq.status === QuotationStatus.CONVERTED_TO_ORDER || rfq.status === QuotationStatus.DECLINED) {
      throw new AppError(`Cannot quote on RFQ in status "${rfq.status}"`, 400);
    }

    const latestVersion = rfq.quotations[0]?.versionNumber || 0;
    const newVersion = latestVersion + 1;

    let subtotal = 0;
    const itemsData = items.map((it: any) => {
      const unitPrice = parseFloat(it.offeredUnitPrice);
      const qty = parseInt(it.quantity, 10);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      return {
        productId: it.productId || null,
        productName: it.productName,
        quantity: qty,
        unit: (it.unit as WholesaleUnit) || WholesaleUnit.CARTON,
        offeredUnitPrice: unitPrice,
        lineTotal,
        notes: it.notes || null,
      };
    });

    const parsedShipping = parseFloat(shippingFee as any) || 0;
    const parsedTax = parseFloat(taxFee as any) || 0;
    const totalPrice = subtotal + parsedShipping + parsedTax;
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new Quotation version
      const quotation = await tx.quotation.create({
        data: {
          quotationRequestId: rfq.id,
          versionNumber: newVersion,
          status: QuotationStatus.SUBMITTED,
          subtotal,
          shippingFee: parsedShipping,
          taxFee: parsedTax,
          totalPrice,
          paymentTerms,
          leadTimeDays: parseInt(leadTimeDays as any, 10) || 3,
          validUntil,
          supplierNotes,
          submittedById: userId,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      // 2. Update RFQ status
      await tx.quotationRequest.update({
        where: { id: rfq.id },
        data: { status: QuotationStatus.SUBMITTED },
      });

      // 3. Record revision history
      await tx.quotationRevision.create({
        data: {
          quotationRequestId: rfq.id,
          versionNumber: newVersion,
          actorId: userId,
          action: 'SUPPLIER_OFFER_SUBMITTED',
          snapshotData: {
            versionNumber: newVersion,
            items: itemsData,
            subtotal,
            totalPrice,
            paymentTerms,
            leadTimeDays,
            validUntil,
            supplierNotes,
          },
          message: supplierNotes || `Official quotation version ${newVersion} submitted by supplier`,
        },
      });

      return quotation;
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Official quotation submitted to buyer successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const requestRevision = async (
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
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      throw new AppError('Revision request message is required', 400);
    }

    const rfq = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    if (rfq.buyerUserId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Only the buyer can request quotation revisions', 403);
    }

    const latestVersion = rfq.quotations[0]?.versionNumber || 1;

    await prisma.$transaction(async (tx) => {
      await tx.quotationRequest.update({
        where: { id },
        data: { status: QuotationStatus.BUYER_REVISION_REQUESTED },
      });

      await tx.quotationRevision.create({
        data: {
          quotationRequestId: id,
          versionNumber: latestVersion,
          actorId: userId,
          action: 'BUYER_REVISION_REQUESTED',
          snapshotData: { requestedBy: userId, timestamp: new Date() },
          message: message.trim(),
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Revision requested. The supplier has been notified.',
    });
  } catch (error) {
    next(error);
  }
};

export const declineRfq = async (
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
    const { reason = 'Quotation declined' } = req.body;

    const rfq = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    const isBuyer = rfq.buyerUserId === userId;
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: rfq.supplierBusinessId },
    });
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isBuyer && !isSupplier && !isAdmin) {
      throw new AppError('Not authorized to decline this RFQ', 403);
    }

    const latestVersion = rfq.quotations[0]?.versionNumber || 1;

    await prisma.$transaction(async (tx) => {
      await tx.quotationRequest.update({
        where: { id },
        data: { status: QuotationStatus.DECLINED },
      });

      await tx.quotationRevision.create({
        data: {
          quotationRequestId: id,
          versionNumber: latestVersion,
          actorId: userId,
          action: isBuyer ? 'BUYER_DECLINED' : 'SUPPLIER_DECLINED',
          snapshotData: { declinedBy: userId, reason },
          message: reason,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Quotation request has been declined',
    });
  } catch (error) {
    next(error);
  }
};

export const acceptQuotation = async (
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
    const { shippingAddressId, paymentMethod = 'BANK_TRANSFER', notes } = req.body;

    const rfq = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        quotations: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { items: true },
        },
      },
    });

    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    if (rfq.buyerUserId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Only the buyer can accept a quotation', 403);
    }

    const latestQuote = rfq.quotations[0];
    if (!latestQuote) {
      throw new AppError('No quotation offer found to accept', 400);
    }

    if (rfq.status === QuotationStatus.ACCEPTED || rfq.status === QuotationStatus.CONVERTED_TO_ORDER) {
      throw new AppError('This quotation has already been accepted and converted into a purchase order', 400);
    }

    if (new Date() > new Date(latestQuote.validUntil)) {
      throw new AppError('This quotation has expired. Please request a refreshed quote from the supplier.', 400);
    }

    // Resolve delivery address
    let addressId = shippingAddressId;
    if (!addressId) {
      const defaultAddr = await prisma.address.findFirst({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      if (!defaultAddr) {
        throw new AppError('A delivery address is required to convert an accepted quotation to an order', 400);
      }
      addressId = defaultAddr.id;
    }

    // Execute atomic transaction: Create Order from accepted quote & mark RFQ converted
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Check & deduct stock for any items that reference a catalog product
      for (const item of latestQuote.items) {
        if (item.productId) {
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });
          if (inv && inv.quantity < item.quantity) {
            throw new AppError(
              `Insufficient stock for catalog product "${item.productName}". Available: ${inv.quantity}, Required: ${item.quantity}`,
              400
            );
          }
          if (inv) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }
      }

      // 2. Create Order
      const orderNumber = generateOrderNumber();
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerBusinessId: rfq.buyerBusinessId,
          buyerUserId: userId,
          supplierBusinessId: rfq.supplierBusinessId,
          shippingAddressId: addressId,
          status: OrderStatus.PENDING_CONFIRMATION,
          subtotal: latestQuote.subtotal,
          shippingAmount: latestQuote.shippingFee,
          taxAmount: latestQuote.taxFee,
          totalAmount: latestQuote.totalPrice,
          currency: 'ETB',
          notes: notes || `Order generated from accepted Quotation ${rfq.rfqNumber} (v${latestQuote.versionNumber})`,
          quotationId: latestQuote.id,
          items: {
            create: latestQuote.items.map((it) => ({
              productId: it.productId || 'custom-item',
              productName: it.productName,
              wholesaleUnit: it.unit,
              unitPrice: it.offeredUnitPrice,
              quantity: it.quantity,
              totalPrice: it.lineTotal,
            })),
          },
          statusHistory: {
            create: {
              newStatus: OrderStatus.PENDING_CONFIRMATION,
              changedById: userId,
              notes: `Order created from accepted Quotation #${rfq.rfqNumber}`,
            },
          },
        },
      });

      // 3. Mark Quotation & RFQ as ACCEPTED / CONVERTED_TO_ORDER
      await tx.quotation.update({
        where: { id: latestQuote.id },
        data: { status: QuotationStatus.ACCEPTED },
      });

      await tx.quotationRequest.update({
        where: { id: rfq.id },
        data: { status: QuotationStatus.CONVERTED_TO_ORDER },
      });

      // 4. Record revision history snapshot
      await tx.quotationRevision.create({
        data: {
          quotationRequestId: rfq.id,
          versionNumber: latestQuote.versionNumber,
          actorId: userId,
          action: 'ACCEPTED_AND_CONVERTED_TO_ORDER',
          snapshotData: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalPrice: latestQuote.totalPrice,
            acceptedAt: new Date(),
          },
          message: `Quotation accepted by buyer. Order ${order.orderNumber} successfully generated.`,
        },
      });

      return order;
    });

    res.status(201).json({
      success: true,
      data: createdOrder,
      message: `Quotation accepted! Wholesale Order #${createdOrder.orderNumber} has been generated.`,
    });
  } catch (error) {
    next(error);
  }
};
