import { apiClient, ApiResponse } from '../lib/api-client';
import { WholesaleUnit, BusinessType } from '../types';

export interface PriceTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  description: string;
  wholesaleUnit: WholesaleUnit;
  minOrderQuantity: number;
  packageWeightKg: number | null;
  leadTimeDays: number;
  images: ProductImage[];
  priceTiers: PriceTier[];
  inventory?: {
    quantity: number;
    lowStockAlert: boolean;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    city: string;
    subCity?: string | null;
    woreda?: string | null;
    isVerified: boolean;
    phone?: string;
    email?: string;
    supplierProfile?: {
      verificationStatus: string;
      establishedYear?: number | null;
      deliveryTerms?: string | null;
      paymentTerms?: string | null;
    };
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  city: string;
  subCity: string | null;
  addressLine: string;
  phone: string;
  email: string;
  description: string | null;
  isVerified: boolean;
  supplierProfile?: {
    verificationStatus: string;
    establishedYear: number | null;
    minimumOrderAmount: number | null;
    deliveryTerms: string | null;
  };
  _count?: {
    products: number;
  };
  products?: Product[];
}

export const catalogService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient<Category[]>('/categories');
  },

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category & { products: Product[] }>> {
    return apiClient<Category & { products: Product[] }>(`/categories/${slug}`);
  },

  async getProducts(params: Record<string, string> = {}): Promise<
    ApiResponse<{
      products: Product[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    }>
  > {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/products?${query}` : '/products';
    return apiClient(endpoint);
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return apiClient<Product>(`/products/${slug}`);
  },

  async getSuppliers(params: Record<string, string> = {}): Promise<ApiResponse<Supplier[]>> {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/suppliers?${query}` : '/suppliers';
    return apiClient<Supplier[]>(endpoint);
  },

  async getSupplierBySlug(slug: string): Promise<ApiResponse<Supplier>> {
    return apiClient<Supplier>(`/suppliers/${slug}`);
  },
};
