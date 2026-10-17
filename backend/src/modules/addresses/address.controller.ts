import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';

export const getAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
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
      recipientName,
      phoneNumber,
      country = 'Ethiopia',
      city = 'Addis Ababa',
      subCity,
      woreda,
      kebele,
      houseNumber,
      landmark,
      postalCode,
      isDefault = false,
    } = req.body;

    if (!recipientName || !phoneNumber || !subCity) {
      throw new AppError('Recipient name, phone number, and sub-city are required', 400);
    }

    // If marked default, reset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        recipientName,
        phoneNumber,
        country,
        city,
        subCity,
        woreda,
        kebele,
        houseNumber,
        landmark,
        postalCode,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
      message: 'Address created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
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
    await prisma.address.deleteMany({
      where: { id, userId },
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
