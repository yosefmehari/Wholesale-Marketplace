import { apiClient, ApiResponse } from '../lib/api-client';
import { Address } from './address.service';

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_DISPATCH'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string | null;
  wholesaleUnit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  product?: {
    id: string;
    images?: Array<{ url: string; isPrimary: boolean }>;
  };
}

export interface OrderStatusHistoryItem {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedById: string;
  notes: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerBusinessId: string;
  buyerUserId: string;
  supplierBusinessId: string;
  shippingAddressId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  cancellationReason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  supplierBusiness?: {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    city: string;
    subCity: string | null;
    addressLine?: string;
    isVerified: boolean;
  };
  buyerBusiness?: {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
  };
  buyerUser?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  shippingAddress?: Address;
  statusHistory?: OrderStatusHistoryItem[];
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CheckoutPayload {
  shippingAddressId?: string;
  newAddress?: {
    recipientName: string;
    phoneNumber: string;
    subCity: string;
    woreda?: string;
    houseNumber?: string;
    landmark?: string;
  };
  paymentMethod?: string;
  notes?: string;
  itemIds?: string[];
}

export const orderService = {
  async checkout(payload: CheckoutPayload): Promise<ApiResponse<Order[]>> {
    return apiClient<Order[]>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getBuyerOrders(params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<OrderListResponse>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<OrderListResponse>(`/orders${qs}`);
  },

  async getOrderDetails(id: string): Promise<ApiResponse<Order>> {
    return apiClient<Order>(`/orders/${id}`);
  },

  async cancelOrder(id: string, reason: string): Promise<ApiResponse<Order>> {
    return apiClient<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string, rejectionReason?: string): Promise<ApiResponse<Order>> {
    return apiClient<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, rejectionReason }),
    });
  },

  async getSupplierOrders(params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<OrderListResponse>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<OrderListResponse>(`/orders/supplier/list${qs}`);
  },
};
