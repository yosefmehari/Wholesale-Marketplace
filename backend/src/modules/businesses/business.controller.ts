import { Request, Response, NextFunction } from 'express';
import { BusinessMemberRole, UserRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { createBusinessSchema, updateBusinessSchema } from './business.dto';

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

export const createBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const validatedData = createBusinessSchema.parse(req.body);
    const slug = generateSlug(validatedData.name);

    const business = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name: validatedData.name,
          slug,
          businessType: validatedData.businessType,
          tinNumber: validatedData.tinNumber,
          registrationNumber: validatedData.registrationNumber,
          email: validatedData.email,
          phone: validatedData.phone,
          website: validatedData.website || null,
          description: validatedData.description,
          city: validatedData.city,
          subCity: validatedData.subCity,
          woreda: validatedData.woreda,
          addressLine: validatedData.addressLine,
          isVerified: false,
          memberships: {
            create: {
              userId: req.user!.id,
              role: BusinessMemberRole.OWNER,
            },
          },
          // If the registering user is a supplier, create a pending supplier profile
          ...(req.user!.role === UserRole.SUPPLIER
            ? {
                supplierProfile: {
                  create: {
                    verificationStatus: VerificationStatus.PENDING,
                    establishedYear: validatedData.establishedYear,
                    deliveryTerms: validatedData.deliveryTerms,
                    paymentTerms: validatedData.paymentTerms,
                    minimumOrderAmount: validatedData.minimumOrderAmount,
                  },
                },
              }
            : {}),
        },
        include: {
          supplierProfile: true,
          memberships: true,
        },
      });

      return newBusiness;
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBusinesses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const memberships = await prisma.businessMembership.findMany({
      where: { userId: req.user.id },
      include: {
        business: {
          include: {
            supplierProfile: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: memberships.map((m) => ({
        role: m.role,
        business: m.business,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getBusinessById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        supplierProfile: {
          select: {
            id: true,
            verificationStatus: true,
            establishedYear: true,
            deliveryTerms: true,
            paymentTerms: true,
            minimumOrderAmount: true,
          },
        },
      },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const validatedData = updateBusinessSchema.parse(req.body);

    // Check ownership
    const membership = await prisma.businessMembership.findUnique({
      where: {
        businessId_userId: {
          businessId: id,
          userId: req.user.id,
        },
      },
    });

    if (!membership && req.user.role !== UserRole.ADMIN) {
      throw new AppError('Forbidden: You are not authorized to update this business', 403);
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(validatedData.name ? { name: validatedData.name } : {}),
        ...(validatedData.businessType ? { businessType: validatedData.businessType } : {}),
        ...(validatedData.tinNumber !== undefined ? { tinNumber: validatedData.tinNumber } : {}),
        ...(validatedData.registrationNumber !== undefined
          ? { registrationNumber: validatedData.registrationNumber }
          : {}),
        ...(validatedData.email ? { email: validatedData.email } : {}),
        ...(validatedData.phone ? { phone: validatedData.phone } : {}),
        ...(validatedData.website !== undefined ? { website: validatedData.website || null } : {}),
        ...(validatedData.description !== undefined ? { description: validatedData.description } : {}),
        ...(validatedData.city ? { city: validatedData.city } : {}),
        ...(validatedData.subCity !== undefined ? { subCity: validatedData.subCity } : {}),
        ...(validatedData.woreda !== undefined ? { woreda: validatedData.woreda } : {}),
        ...(validatedData.addressLine ? { addressLine: validatedData.addressLine } : {}),
      },
      include: {
        supplierProfile: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
