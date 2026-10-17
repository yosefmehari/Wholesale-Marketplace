import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            priceTiers: {
              orderBy: { minQuantity: 'asc' },
            },
            inventory: {
              select: {
                quantity: true,
                lowStockAlert: true,
              },
            },
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
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { productId } = req.params;
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Upsert / create favorite
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      create: {
        userId,
        productId,
      },
      update: {},
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Product added to favorites',
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { productId } = req.params;
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    await prisma.favorite.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

export const checkFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(200).json({
        success: true,
        data: { isFavorited: false },
      });
      return;
    }

    const { productId } = req.params;
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { isFavorited: !!favorite },
    });
  } catch (error) {
    next(error);
  }
};
