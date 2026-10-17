import { Request, Response, NextFunction } from 'express';
import { ProductStatus, Prisma, WholesaleUnit } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      category,
      supplier,
      city,
      subCity,
      minMoq,
      maxMoq,
      minPrice,
      maxPrice,
      unit,
      inStock,
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNumber - 1) * take;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(search
        ? {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { description: { contains: search as string, mode: 'insensitive' } },
              { brand: { contains: search as string, mode: 'insensitive' } },
              { sku: { contains: search as string, mode: 'insensitive' } },
              {
                category: {
                  name: { contains: search as string, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(category
        ? {
            category: {
              slug: category as string,
            },
          }
        : {}),
      ...(supplier
        ? {
            business: {
              OR: [{ id: supplier as string }, { slug: supplier as string }],
            },
          }
        : {}),
      ...(city || subCity
        ? {
            business: {
              ...(city
                ? { city: { contains: city as string, mode: 'insensitive' } }
                : {}),
              ...(subCity
                ? { subCity: { contains: subCity as string, mode: 'insensitive' } }
                : {}),
            },
          }
        : {}),
      ...(minMoq || maxMoq
        ? {
            minOrderQuantity: {
              ...(minMoq ? { gte: parseInt(minMoq as string, 10) } : {}),
              ...(maxMoq ? { lte: parseInt(maxMoq as string, 10) } : {}),
            },
          }
        : {}),
      ...(minPrice || maxPrice
        ? {
            priceTiers: {
              some: {
                unitPrice: {
                  ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
                  ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
                },
              },
            },
          }
        : {}),
      ...(unit ? { wholesaleUnit: unit as WholesaleUnit } : {}),
      ...(inStock === 'true' || inStock === '1'
        ? {
            inventory: {
              quantity: { gt: 0 },
            },
          }
        : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'moq_asc') {
      orderBy = { minOrderQuantity: 'asc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
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
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    if (sortBy === 'price_asc') {
      products.sort((a, b) => {
        const minA = a.priceTiers[0]?.unitPrice ? Number(a.priceTiers[0].unitPrice) : 0;
        const minB = b.priceTiers[0]?.unitPrice ? Number(b.priceTiers[0].unitPrice) : 0;
        return minA - minB;
      });
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => {
        const minA = a.priceTiers[0]?.unitPrice ? Number(a.priceTiers[0].unitPrice) : 0;
        const minB = b.priceTiers[0]?.unitPrice ? Number(b.priceTiers[0].unitPrice) : 0;
        return minB - minA;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNumber,
          limit: take,
          totalCount,
          totalPages: Math.ceil(totalCount / take),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        priceTiers: {
          orderBy: { minQuantity: 'asc' },
        },
        inventory: {
          select: {
            quantity: true,
            reorderThreshold: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            subCity: true,
            woreda: true,
            addressLine: true,
            phone: true,
            email: true,
            isVerified: true,
            supplierProfile: {
              select: {
                verificationStatus: true,
                establishedYear: true,
                deliveryTerms: true,
                paymentTerms: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            authorUser: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new AppError('Product not found or is currently unavailable', 404);
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
