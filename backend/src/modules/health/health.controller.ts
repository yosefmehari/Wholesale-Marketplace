import { Request, Response } from 'express';
import { env } from '../../config/env';

export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'WholesaleHub Ethiopia API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      defaultCurrency: env.DEFAULT_CURRENCY,
      timezone: env.DEFAULT_TIMEZONE,
    },
  });
};
