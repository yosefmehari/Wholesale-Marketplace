import { Request, Response, NextFunction } from 'express';
import { ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

/**
 * Helper to compute the applicable wholesale unit price for a given quantity
 */
export function calculateTierUnitPrice(priceTiers: Array<{ minQuantity: number; maxQuantity: number | null; unitPrice: any }>, quantity: number): number {
  if (!priceTiers || priceTiers.length === 0) return 0;

  // Find tier where quantity fits within [minQuantity, maxQuantity]
  const matchedTier = priceTiers.find((t) => {
    if (t.maxQuantity !== null && t.maxQuantity !== undefined) {
      return quantity >= t.minQuantity && quantity <= t.maxQuantity;
    }
    return quantity >= t.minQuantity;
  });

  if (matchedTier) {
    return Number(matchedTier.unitPrice);
  }

  // Fallback to the tier with the lowest minQuantity
  const sorted = [...priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  return Number(sorted[0].unitPrice);
}

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                priceTiers: { orderBy: { minQuantity: 'asc' } },
                inventory: { select: { quantity: true, lowStockAlert: true } },
                business: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    city: true,
                    subCity: true,
                    isVerified: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                  priceTiers: { orderBy: { minQuantity: 'asc' } },
                  inventory: { select: { quantity: true, lowStockAlert: true } },
                  business: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      city: true,
                      subCity: true,
                      isVerified: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    let subtotal = 0;
    let totalItems = 0;
    let hasValidationErrors = false;

    // Process and enrich items with dynamic tier pricing & stock validity
    const processedItems = cart.items.map((item) => {
      const p = item.product;
      const unitPrice = calculateTierUnitPrice(p.priceTiers, item.quantity);
      const itemTotal = unitPrice * item.quantity;
      const availableStock = p.inventory?.quantity ?? 0;
      const isMoqSatisfied = item.quantity >= p.minOrderQuantity;
      const isStockAvailable = availableStock >= item.quantity;
      const isValid = isMoqSatisfied && isStockAvailable && p.status === ProductStatus.PUBLISHED;

      if (!isValid) {
        hasValidationErrors = true;
      }

      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        isMoqSatisfied,
        isStockAvailable,
        availableStock,
        minOrderQuantity: p.minOrderQuantity,
        wholesaleUnit: p.wholesaleUnit,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
          primaryImage: p.images[0]?.url || null,
          business: p.business,
          priceTiers: p.priceTiers,
        },
      };
    });

    // Group items by supplier for multi-supplier breakdown
    const supplierGroups: Record<
      string,
      {
        supplier: {
          id: string;
          name: string;
          slug: string;
          city: string;
          subCity: string | null;
          isVerified: boolean;
        };
        items: typeof processedItems;
        subtotal: number;
      }
    > = {};

    for (const item of processedItems) {
      const sup = item.product.business;
      if (!supplierGroups[sup.id]) {
        supplierGroups[sup.id] = {
          supplier: sup,
          items: [],
          subtotal: 0,
        };
      }
      supplierGroups[sup.id].items.push(item);
      supplierGroups[sup.id].subtotal += item.totalPrice;
    }

    res.status(200).json({
      success: true,
      data: {
        id: cart.id,
        items: processedItems,
        supplierGroups: Object.values(supplierGroups),
        totalItems,
        subtotal,
        currency: 'ETB',
        hasValidationErrors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      throw new AppError('Valid productId and positive quantity are required', 400);
    }

    // Verify product exists and is published
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
        priceTiers: { orderBy: { minQuantity: 'asc' } },
      },
    });

    if (!product || product.deletedAt || product.status !== ProductStatus.PUBLISHED) {
      throw new AppError('Product is not available for wholesale ordering', 404);
    }

    // Ensure user has a cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if item is already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Check inventory stock
    const availableStock = product.inventory?.quantity ?? 0;
    if (availableStock < targetQuantity) {
      throw new AppError(
        `Requested quantity (${targetQuantity}) exceeds available stock (${availableStock})`,
        400
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: targetQuantity,
      },
      update: {
        quantity: targetQuantity,
      },
    });

    res.status(201).json({
      success: true,
      data: cartItem,
      message: 'Product added to cart',
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
      throw new AppError('Quantity must be a positive integer', 400);
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          include: { inventory: true },
        },
      },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new AppError('Cart item not found in your cart', 404);
    }

    const availableStock = cartItem.product.inventory?.quantity ?? 0;
    if (availableStock < quantity) {
      throw new AppError(
        `Requested quantity (${quantity}) exceeds available stock (${availableStock})`,
        400
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Cart quantity updated',
    });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { itemId } = req.params;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};
