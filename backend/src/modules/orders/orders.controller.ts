import { Request, Response, NextFunction } from 'express';
import { OrderStatus, BusinessType, BusinessMemberRole, ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { calculateTierUnitPrice } from '../cart/cart.controller';

/**
 * Generate human-readable B2B order number (e.g. WH-ORD-20261017-8492)
 */
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `WH-ORD-${dateStr}-${randomSuffix}`;
}

/**
 * Valid forward order transitions
 */
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_CONFIRMATION]: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

export const checkout = async (
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
      shippingAddressId,
      newAddress,
      paymentMethod = 'BANK_TRANSFER',
      notes,
      itemIds, // optional: specific cart items to checkout
    } = req.body;

    // 1. Resolve or create shipping address
    let finalAddressId = shippingAddressId;
    if (!finalAddressId && newAddress) {
      if (!newAddress.recipientName || !newAddress.phoneNumber || !newAddress.subCity) {
        throw new AppError('Shipping address requires recipientName, phoneNumber, and subCity', 400);
      }
      const createdAddr = await prisma.address.create({
        data: {
          userId,
          recipientName: newAddress.recipientName,
          phoneNumber: newAddress.phoneNumber,
          country: newAddress.country || 'Ethiopia',
          city: newAddress.city || 'Addis Ababa',
          subCity: newAddress.subCity,
          woreda: newAddress.woreda,
          houseNumber: newAddress.houseNumber,
          landmark: newAddress.landmark,
          isDefault: true,
        },
      });
      finalAddressId = createdAddr.id;
    }

    if (!finalAddressId) {
      // Check if user has an existing default address
      const existingAddr = await prisma.address.findFirst({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      if (!existingAddr) {
        throw new AppError('Delivery address is required for checkout', 400);
      }
      finalAddressId = existingAddr.id;
    }

    // 2. Resolve buyer's business profile
    let buyerBusiness = await prisma.business.findFirst({
      where: {
        memberships: {
          some: { userId },
        },
      },
    });

    if (!buyerBusiness) {
      // Create a default buyer business profile for this commercial account
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const slug = `buyer-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;
      buyerBusiness = await prisma.business.create({
        data: {
          name: user?.fullName ? `${user.fullName} Enterprises` : 'Commercial Buyer',
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

    // 3. Retrieve user cart and items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                priceTiers: { orderBy: { minQuantity: 'asc' } },
                business: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Your cart is empty', 400);
    }

    // Filter items if specific IDs requested
    const selectedItems = itemIds && Array.isArray(itemIds) && itemIds.length > 0
      ? cart.items.filter((i) => itemIds.includes(i.id))
      : cart.items;

    if (selectedItems.length === 0) {
      throw new AppError('No valid items selected for checkout', 400);
    }

    // Group items by supplier (multi-supplier checkout split)
    const itemsBySupplier: Record<string, typeof selectedItems> = {};
    for (const item of selectedItems) {
      const supId = item.product.businessId;
      if (!itemsBySupplier[supId]) {
        itemsBySupplier[supId] = [];
      }
      itemsBySupplier[supId].push(item);
    }

    // 4. Execute atomic transaction to reserve stock & create split orders
    const createdOrders = await prisma.$transaction(async (tx) => {
      const ordersResult = [];

      for (const [supplierId, supplierItems] of Object.entries(itemsBySupplier)) {
        let orderSubtotal = 0;
        const orderItemsData: Array<{
          productId: string;
          productName: string;
          productSku: string | null;
          wholesaleUnit: any;
          unitPrice: number;
          quantity: number;
          totalPrice: number;
        }> = [];

        // Validate stock & MOQ for every item in supplier group
        for (const item of supplierItems) {
          const product = item.product;

          if (product.status !== ProductStatus.PUBLISHED || product.deletedAt) {
            throw new AppError(`Product "${product.name}" is no longer available`, 400);
          }

          if (item.quantity < product.minOrderQuantity) {
            throw new AppError(
              `Order quantity (${item.quantity}) for "${product.name}" is below Minimum Order Quantity (${product.minOrderQuantity})`,
              400
            );
          }

          // Fetch fresh inventory with lock
          const inv = await tx.inventory.findUnique({
            where: { productId: product.id },
          });

          const currentStock = inv?.quantity ?? 0;
          if (currentStock < item.quantity) {
            throw new AppError(
              `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${item.quantity}`,
              400
            );
          }

          // Calculate applicable wholesale tier price
          const unitPrice = calculateTierUnitPrice(product.priceTiers, item.quantity);
          const itemTotal = unitPrice * item.quantity;
          orderSubtotal += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            wholesaleUnit: product.wholesaleUnit,
            unitPrice,
            quantity: item.quantity,
            totalPrice: itemTotal,
          });

          // Atomically decrement inventory quantity
          await tx.inventory.update({
            where: { productId: product.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Generate distinct order number for each supplier order
        let orderNum = generateOrderNumber();
        // Ensure uniqueness
        const exists = await tx.order.findUnique({ where: { orderNumber: orderNum } });
        if (exists) {
          orderNum = `${orderNum}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber: orderNum,
            buyerBusinessId: buyerBusiness.id,
            buyerUserId: userId,
            supplierBusinessId: supplierId,
            shippingAddressId: finalAddressId,
            status: OrderStatus.PENDING_CONFIRMATION,
            subtotal: orderSubtotal,
            taxAmount: 0,
            shippingAmount: 0,
            discountAmount: 0,
            totalAmount: orderSubtotal,
            currency: 'ETB',
            notes,
            items: {
              create: orderItemsData.map((d) => ({
                productId: d.productId,
                productName: d.productName,
                productSku: d.productSku,
                wholesaleUnit: d.wholesaleUnit,
                unitPrice: d.unitPrice,
                quantity: d.quantity,
                totalPrice: d.totalPrice,
              })),
            },
            statusHistory: {
              create: {
                newStatus: OrderStatus.PENDING_CONFIRMATION,
                changedById: userId,
                notes: `Order created via multi-supplier checkout (${supplierItems.length} items)`,
              },
            },
          },
          include: {
            items: true,
            supplierBusiness: {
              select: {
                id: true,
                name: true,
                slug: true,
                phone: true,
                email: true,
                city: true,
                subCity: true,
                isVerified: true,
              },
            },
          },
        });

        ordersResult.push(newOrder);
      }

      // Remove checked-out items from CartItem
      const checkedOutItemIds = selectedItems.map((i) => i.id);
      await tx.cartItem.deleteMany({
        where: { id: { in: checkedOutItemIds } },
      });

      return ordersResult;
    });

    res.status(201).json({
      success: true,
      data: createdOrders,
      message: `Checkout successful! Created ${createdOrders.length} supplier order(s).`,
    });
  } catch (error) {
    next(error);
  }
};

export const getBuyerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      buyerUserId: userId,
      ...(status && status !== 'ALL' ? { status: status as OrderStatus } : {}),
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          supplierBusiness: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              subCity: true,
              isVerified: true,
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
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

export const getOrderDetails = async (
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

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        supplierBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            city: true,
            subCity: true,
            addressLine: true,
            isVerified: true,
          },
        },
        buyerBusiness: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
          },
        },
        buyerUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        shippingAddress: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Authorization: User must be buyer, supplier team member, or admin
    const isAdmin = req.user?.role === 'ADMIN';
    const isBuyer = order.buyerUserId === userId;
    const isSupplier = await prisma.businessMembership.findFirst({
      where: {
        userId,
        businessId: order.supplierBusinessId,
      },
    });

    if (!isAdmin && !isBuyer && !isSupplier) {
      throw new AppError('You are not authorized to view this order', 403);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
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
    const { reason = 'Cancelled by buyer' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Role verification
    const isBuyer = order.buyerUserId === userId;
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: order.supplierBusinessId },
    });
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isBuyer && !isSupplier && !isAdmin) {
      throw new AppError('Not authorized to cancel this order', 403);
    }

    // Cancellation eligibility:
    // Buyer can only cancel if PENDING_CONFIRMATION
    if (isBuyer && !isAdmin && order.status !== OrderStatus.PENDING_CONFIRMATION) {
      throw new AppError(
        `Orders in "${order.status}" status cannot be self-cancelled by buyers. Please contact the supplier directly.`,
        400
      );
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED || order.status === OrderStatus.DELIVERED) {
      throw new AppError(`Cannot cancel an order with status "${order.status}"`, 400);
    }

    // Execute atomic cancellation and stock restoration
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Restore inventory for all items
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // 2. Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason,
        },
      });

      // 3. Record status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus: OrderStatus.CANCELLED,
          changedById: userId,
          notes: `Order cancelled. Reason: ${reason}. Inventory restored.`,
        },
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully and stock restored',
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
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
    const { status: newStatus, notes, rejectionReason } = req.body;

    if (!newStatus || !Object.values(OrderStatus).includes(newStatus)) {
      throw new AppError('Valid order status is required', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify user is member of supplier business or admin
    const isAdmin = req.user?.role === 'ADMIN';
    const isSupplier = await prisma.businessMembership.findFirst({
      where: { userId, businessId: order.supplierBusinessId },
    });

    if (!isAdmin && !isSupplier) {
      throw new AppError('Only the supplier or platform admin can update order fulfillment status', 403);
    }

    // Validate state transition
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from "${order.status}" to "${newStatus}". Allowed next statuses: ${allowedNext.join(', ') || 'None'}`,
        400
      );
    }

    // If REJECTED, restore inventory
    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (newStatus === OrderStatus.REJECTED || newStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          ...(rejectionReason ? { rejectionReason } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus,
          changedById: userId,
          notes: notes || `Status updated to ${newStatus}${rejectionReason ? ` (Reason: ${rejectionReason})` : ''}`,
        },
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${newStatus}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Find supplier business
    const membership = await prisma.businessMembership.findFirst({
      where: { userId },
      include: { business: true },
    });

    if (!membership) {
      throw new AppError('No business profile associated with this account', 404);
    }

    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      supplierBusinessId: membership.businessId,
      ...(status && status !== 'ALL' ? { status: status as OrderStatus } : {}),
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          buyerBusiness: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              subCity: true,
            },
          },
          buyerUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
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
