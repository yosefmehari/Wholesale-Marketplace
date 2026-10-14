import { Request, Response, NextFunction } from 'express';
import { VerificationStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { city, businessType, search } = req.query;

    const suppliers = await prisma.business.findMany({
      where: {
        isVerified: true,
        supplierProfile: {
          verificationStatus: VerificationStatus.APPROVED,
        },
        ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
        ...(businessType ? { businessType: businessType as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        supplierProfile: {
          select: {
            verificationStatus: true,
            establishedYear: true,
            minimumOrderAmount: true,
            deliveryTerms: true,
          },
        },
        _count: {
          select: {
            products: {
              where: { status: ProductStatus.PUBLISHED },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const supplier = await prisma.business.findUnique({
      where: { slug },
      include: {
        supplierProfile: true,
        products: {
          where: { status: ProductStatus.PUBLISHED },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            priceTiers: { orderBy: { minQuantity: 'asc' } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!supplier || !supplier.supplierProfile) {
      throw new AppError('Supplier not found', 404);
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};
