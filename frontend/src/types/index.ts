// Core domain type definitions for WholesaleHub Ethiopia

export type UserRole = 'GUEST' | 'BUYER' | 'SUPPLIER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type BusinessType =
  | 'MANUFACTURER'
  | 'IMPORTER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'RETAILER'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'SUSPENDED';

export type DocumentType =
  | 'BUSINESS_LICENSE'
  | 'TIN_CERTIFICATE'
  | 'VAT_CERTIFICATE'
  | 'IMPORT_EXPORT_PERMIT'
  | 'OTHER';

export type WholesaleUnit =
  | 'PIECE'
  | 'CARTON'
  | 'BOX'
  | 'KILOGRAM'
  | 'BAG'
  | 'LITER'
  | 'PACK'
  | 'SET'
  | 'DOZEN'
  | 'ROLL'
  | 'METER';

export type Currency = 'ETB' | 'USD';

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number | null;
  unitPrice: number; // in ETB
}
