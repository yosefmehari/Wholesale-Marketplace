import { z } from 'zod';
import { BusinessType } from '@prisma/client';

export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.nativeEnum(BusinessType),
  tinNumber: z.string().regex(/^\d{10}$/, 'Ethiopian TIN must be 10 digits').optional(),
  registrationNumber: z.string().optional(),
  email: z.string().email('Valid business contact email is required'),
  phone: z.string().min(9, 'Valid business phone number is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  city: z.string().default('Addis Ababa'),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
  addressLine: z.string().min(3, 'Physical address line is required'),

  // Optional supplier onboarding fields
  establishedYear: z.number().int().min(1950).max(new Date().getFullYear()).optional(),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  minimumOrderAmount: z.number().positive().optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
