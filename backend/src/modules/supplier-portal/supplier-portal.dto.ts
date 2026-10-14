import { z } from 'zod';
import { WholesaleUnit, ProductStatus, DocumentType } from '@prisma/client';

export const createPriceTierSchema = z.object({
  minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1'),
  maxQuantity: z.number().int().positive().nullable().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  sku: z.string().optional(),
  brand: z.string().optional(),
  wholesaleUnit: z.nativeEnum(WholesaleUnit),
  minOrderQuantity: z.number().int().min(1, 'MOQ must be at least 1'),
  packageWeightKg: z.number().positive().optional(),
  packageDimensions: z.string().optional(),
  leadTimeDays: z.number().int().min(1).default(1),
  initialStock: z.number().int().min(0).default(0),
  reorderThreshold: z.number().int().min(0).default(5),
  imageUrl: z.string().url('Must be a valid image URL').optional(),
  priceTiers: z
    .array(createPriceTierSchema)
    .min(1, 'At least one wholesale price tier is required'),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
});

export const submitVerificationDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().min(1, 'File URL or storage key is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z.string().default('application/pdf'),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorderThreshold: z.number().int().min(0).optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type SubmitVerificationDocumentDto = z.infer<typeof submitVerificationDocumentSchema>;
export type UpdateStockDto = z.infer<typeof updateStockSchema>;
