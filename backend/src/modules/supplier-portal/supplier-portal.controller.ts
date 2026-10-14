import { Request, Response, NextFunction } from 'express';
import { ProductStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import {
  createProductSchema,
  updateProductSchema,
  submitVerificationDocumentSchema,
  updateStockSchema,
} from './supplier-portal.dto';

const generateSlug = (name: string): string => {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 7)
  );
};

export const getSupplierBusinessForUser = async (userId: string) => {
  const membership = await prisma.businessMembership.findFirst({
    where: { userId },
    include: {
      business: {
        include: {
          supplierProfile: true,
        },
      },
    },
  });

  if (!membership || !membership.business || !membership.business.supplierProfile) {
    throw new AppError('No registered supplier business found for this account.', 404);
  }

  return {
    business: membership.business,
    supplierProfile: membership.business.supplierProfile,
  };
};

export const getSupplierDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business, supplierProfile } = await getSupplierBusinessForUser(req.user!.id);

    const [totalProducts, publishedCount, inventorySummary] = await Promise.all([
      prisma.product.count({ where: { businessId: business.id } }),
      prisma.product.count({
        where: { businessId: business.id, status: ProductStatus.PUBLISHED },
      }),
      prisma.inventory.aggregate({
        where: { product: { businessId: business.id } },
        _sum: { quantity: true },
      }),
    ]);

    const lowStockCount = await prisma.inventory.count({
      where: {
        product: { businessId: business.id },
        quantity: { lte: 10 },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          city: business.city,
          subCity: business.subCity,
          isVerified: business.isVerified,
        },
        supplierProfile: {
          verificationStatus: supplierProfile.verificationStatus,
          verifiedAt: supplierProfile.verifiedAt,
          minimumOrderAmount: supplierProfile.minimumOrderAmount,
        },
        stats: {
          totalProducts,
          publishedProducts: publishedCount,
          totalUnitsInStock: inventorySummary._sum.quantity || 0,
          lowStockAlerts: lowStockCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business } = await getSupplierBusinessForUser(req.user!.id);

    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      include: {
        images: true,
        priceTiers: { orderBy: { minQuantity: 'asc' } },
        inventory: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplierProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business, supplierProfile } = await getSupplierBusinessForUser(req.user!.id);

    const dto = createProductSchema.parse(req.body);

    // Business rule: Unverified suppliers can create drafts or pending reviews, but cannot publish directly
    const initialStatus =
      supplierProfile.verificationStatus === VerificationStatus.APPROVED
        ? ProductStatus.PUBLISHED
        : ProductStatus.PENDING_REVIEW;

    const slug = generateSlug(dto.name);

    // Sort price tiers by minQuantity ascending
    const sortedTiers = [...dto.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          businessId: business.id,
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          sku: dto.sku,
          brand: dto.brand,
          description: dto.description,
          wholesaleUnit: dto.wholesaleUnit,
          minOrderQuantity: dto.minOrderQuantity,
          packageWeightKg: dto.packageWeightKg,
          packageDimensions: dto.packageDimensions,
          leadTimeDays: dto.leadTimeDays,
          status: initialStatus,
          inventory: {
            create: {
              quantity: dto.initialStock,
              reorderThreshold: dto.reorderThreshold,
            },
          },
          priceTiers: {
            create: sortedTiers.map((t) => ({
              minQuantity: t.minQuantity,
              maxQuantity: t.maxQuantity || null,
              unitPrice: t.unitPrice,
            })),
          },
          ...(dto.imageUrl
            ? {
                images: {
                  create: {
                    url: dto.imageUrl,
                    isPrimary: true,
                  },
                },
              }
            : {}),
        },
        include: {
          images: true,
          priceTiers: true,
          inventory: true,
          category: true,
        },
      });

      return newProduct;
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business } = await getSupplierBusinessForUser(req.user!.id);
    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: { id, businessId: business.id },
      include: { priceTiers: true },
    });

    if (!existingProduct) {
      throw new AppError('Product not found or you do not have permission to edit it.', 404);
    }

    const dto = updateProductSchema.parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      // If price tiers were updated, replace them
      if (dto.priceTiers && dto.priceTiers.length > 0) {
        await tx.priceTier.deleteMany({ where: { productId: id } });
        await tx.priceTier.createMany({
          data: dto.priceTiers.map((t) => ({
            productId: id,
            minQuantity: t.minQuantity,
            maxQuantity: t.maxQuantity || null,
            unitPrice: t.unitPrice,
          })),
        });
      }

      const prod = await tx.product.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
          ...(dto.description ? { description: dto.description } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
          ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
          ...(dto.wholesaleUnit ? { wholesaleUnit: dto.wholesaleUnit } : {}),
          ...(dto.minOrderQuantity ? { minOrderQuantity: dto.minOrderQuantity } : {}),
          ...(dto.packageWeightKg !== undefined ? { packageWeightKg: dto.packageWeightKg } : {}),
          ...(dto.leadTimeDays ? { leadTimeDays: dto.leadTimeDays } : {}),
          ...(dto.status ? { status: dto.status } : {}),
        },
        include: {
          images: true,
          priceTiers: { orderBy: { minQuantity: 'asc' } },
          inventory: true,
          category: true,
        },
      });

      return prod;
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business } = await getSupplierBusinessForUser(req.user!.id);

    const inventoryItems = await prisma.inventory.findMany({
      where: { product: { businessId: business.id } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            wholesaleUnit: true,
            minOrderQuantity: true,
          },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: inventoryItems,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { business } = await getSupplierBusinessForUser(req.user!.id);
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId: business.id },
      include: { inventory: true },
    });

    if (!product) {
      throw new AppError('Product not found in your inventory', 404);
    }

    const { quantity, reorderThreshold } = updateStockSchema.parse(req.body);

    const updatedInventory = await prisma.inventory.upsert({
      where: { productId },
      update: {
        quantity,
        ...(reorderThreshold !== undefined ? { reorderThreshold } : {}),
        lowStockAlert: quantity <= (reorderThreshold ?? 5),
      },
      create: {
        productId,
        quantity,
        reorderThreshold: reorderThreshold ?? 5,
        lowStockAlert: quantity <= (reorderThreshold ?? 5),
      },
    });

    res.status(200).json({
      success: true,
      data: updatedInventory,
    });
  } catch (error) {
    next(error);
  }
};

export const submitVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { supplierProfile } = await getSupplierBusinessForUser(req.user!.id);

    const dto = submitVerificationDocumentSchema.parse(req.body);

    const doc = await prisma.supplierVerificationDocument.create({
      data: {
        supplierProfileId: supplierProfile.id,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        status: VerificationStatus.PENDING,
      },
    });

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { supplierProfile } = await getSupplierBusinessForUser(req.user!.id);

    const documents = await prisma.supplierVerificationDocument.findMany({
      where: { supplierProfileId: supplierProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: supplierProfile.verificationStatus,
        verifiedAt: supplierProfile.verifiedAt,
        rejectionReason: supplierProfile.rejectionReason,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};
