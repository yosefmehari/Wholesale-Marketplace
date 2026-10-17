import { Request, Response, NextFunction } from 'express';
import { SettlementStatus, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getSupplierSettlements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const membership = await prisma.businessMembership.findFirst({
      where: { userId },
      include: {
        business: {
          include: { supplierProfile: true },
        },
      },
    });

    const isAdmin = req.user?.role === UserRole.ADMIN;

    if (!membership?.business?.supplierProfile && !isAdmin) {
      throw new AppError('Supplier profile not found for this account', 404);
    }

    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (!isAdmin && membership?.business?.supplierProfile) {
      where.supplierProfileId = membership.business.supplierProfile.id;
    }
    if (status && status !== 'ALL') {
      where.status = status as SettlementStatus;
    }

    const [settlements, totalCount] = await Promise.all([
      prisma.supplierSettlement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.supplierSettlement.count({ where }),
    ]);

    // Calculate totals for dashboard
    const allPending = await prisma.supplierSettlement.aggregate({
      where: {
        ...where,
        status: SettlementStatus.PENDING,
      },
      _sum: { netPayoutAmount: true, commissionAmount: true },
    });

    res.status(200).json({
      success: true,
      data: {
        settlements,
        summary: {
          totalPendingPayout: allPending._sum.netPayoutAmount || 0,
          totalCommissionDeducted: allPending._sum.commissionAmount || 0,
        },
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

export const markSettlementPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { payoutReference = 'BANK-TRANSFER-SETTLEMENT' } = req.body;

    if (req.user?.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can approve and execute settlements', 403);
    }

    const settlement = await prisma.supplierSettlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      throw new AppError('Settlement record not found', 404);
    }

    const updated = await prisma.supplierSettlement.update({
      where: { id },
      data: {
        status: SettlementStatus.PAID,
        paidAt: new Date(),
        payoutReference,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Settlement payout marked as paid',
    });
  } catch (error) {
    next(error);
  }
};
