import { apiClient, ApiResponse } from '../lib/api-client';
import { WholesaleUnit, ProductStatus, VerificationStatus, DocumentType } from '../types';
import { Product } from './catalog.service';

export interface SupplierDashboardData {
  business: {
    id: string;
    name: string;
    slug: string;
    city: string;
    subCity: string | null;
    isVerified: boolean;
  };
  supplierProfile: {
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    minimumOrderAmount: number | null;
  };
  stats: {
    totalProducts: number;
    publishedProducts: number;
    totalUnitsInStock: number;
    lowStockAlerts: number;
  };
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  description: string;
  sku?: string;
  brand?: string;
  wholesaleUnit: WholesaleUnit;
  minOrderQuantity: number;
  packageWeightKg?: number;
  packageDimensions?: string;
  leadTimeDays: number;
  initialStock: number;
  reorderThreshold?: number;
  imageUrl?: string;
  priceTiers: {
    minQuantity: number;
    maxQuantity?: number | null;
    unitPrice: number;
  }[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  reorderThreshold: number;
  lowStockAlert: boolean;
  product: {
    id: string;
    name: string;
    sku: string | null;
    wholesaleUnit: WholesaleUnit;
    minOrderQuantity: number;
  };
}

export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: VerificationStatus;
  createdAt: string;
}

export const supplierService = {
  async getDashboard(accessToken: string): Promise<ApiResponse<SupplierDashboardData>> {
    return apiClient<SupplierDashboardData>('/supplier/dashboard', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async getProducts(accessToken: string): Promise<ApiResponse<Product[]>> {
    return apiClient<Product[]>('/supplier/products', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async createProduct(accessToken: string, input: CreateProductInput): Promise<ApiResponse<Product>> {
    return apiClient<Product>('/supplier/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    });
  },

  async getInventory(accessToken: string): Promise<ApiResponse<InventoryItem[]>> {
    return apiClient<InventoryItem[]>('/supplier/inventory', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async updateStock(
    accessToken: string,
    productId: string,
    quantity: number,
    reorderThreshold?: number
  ): Promise<ApiResponse<unknown>> {
    return apiClient(`/supplier/inventory/${productId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ quantity, reorderThreshold }),
    });
  },

  async getVerificationStatus(accessToken: string): Promise<
    ApiResponse<{
      verificationStatus: VerificationStatus;
      verifiedAt: string | null;
      rejectionReason: string | null;
      documents: VerificationDocument[];
    }>
  > {
    return apiClient('/supplier/verification', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  async submitVerificationDocument(
    accessToken: string,
    data: {
      documentType: DocumentType;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType?: string;
    }
  ): Promise<ApiResponse<VerificationDocument>> {
    return apiClient<VerificationDocument>('/supplier/verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
  },
};
