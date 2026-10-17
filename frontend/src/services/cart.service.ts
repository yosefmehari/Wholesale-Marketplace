import { apiClient, ApiResponse } from '../lib/api-client';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryImage: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
    city: string;
    subCity: string | null;
    isVerified: boolean;
  };
  priceTiers: Array<{
    id: string;
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
  }>;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isMoqSatisfied: boolean;
  isStockAvailable: boolean;
  availableStock: number;
  minOrderQuantity: number;
  wholesaleUnit: string;
  product: CartProduct;
}

export interface SupplierCartGroup {
  supplier: {
    id: string;
    name: string;
    slug: string;
    city: string;
    subCity: string | null;
    isVerified: boolean;
  };
  items: CartItem[];
  subtotal: number;
}

export interface CartData {
  id: string;
  items: CartItem[];
  supplierGroups: SupplierCartGroup[];
  totalItems: number;
  subtotal: number;
  currency: string;
  hasValidationErrors: boolean;
}

export const cartService = {
  async getCart(): Promise<ApiResponse<CartData>> {
    return apiClient<CartData>('/cart');
  },

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  async removeItem(itemId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>('/cart', {
      method: 'DELETE',
    });
  },
};
