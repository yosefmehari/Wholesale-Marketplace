import { apiClient, ApiResponse } from '../lib/api-client';

export type QuotationStatus =
  | 'PENDING_SUPPLIER_REVIEW'
  | 'SUBMITTED'
  | 'BUYER_REVISION_REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CONVERTED_TO_ORDER';

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unit: string;
  offeredUnitPrice: number;
  lineTotal: number;
  notes?: string | null;
}

export interface QuotationVersion {
  id: string;
  quotationRequestId: string;
  versionNumber: number;
  status: QuotationStatus;
  subtotal: number;
  shippingFee: number;
  taxFee: number;
  totalPrice: number;
  paymentTerms?: string | null;
  leadTimeDays: number;
  validUntil: string;
  supplierNotes?: string | null;
  submittedById: string;
  createdAt: string;
  items: QuotationItem[];
}

export interface QuotationRevision {
  id: string;
  quotationRequestId: string;
  versionNumber: number;
  actorId: string;
  action: string;
  snapshotData: any;
  message?: string | null;
  createdAt: string;
}

export interface QuotationRequest {
  id: string;
  rfqNumber: string;
  buyerBusinessId: string;
  buyerUserId: string;
  supplierBusinessId: string;
  status: QuotationStatus;
  title: string;
  deliveryLocation: string;
  targetDeliveryDate?: string | null;
  targetPrice?: number | null;
  notes?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  buyerBusiness?: {
    id: string;
    name: string;
    city: string;
    subCity: string | null;
  };
  supplierBusiness?: {
    id: string;
    name: string;
    city: string;
    subCity: string | null;
    isVerified: boolean;
  };
  quotations: QuotationVersion[];
  revisions?: QuotationRevision[];
}

export interface CreateRfqPayload {
  supplierBusinessId: string;
  title: string;
  deliveryLocation?: string;
  targetDeliveryDate?: string;
  targetPrice?: number;
  notes?: string;
  expiresInDays?: number;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    targetUnitPrice?: number;
    notes?: string;
  }>;
}

export interface SubmitQuotePayload {
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    offeredUnitPrice: number;
    notes?: string;
  }>;
  shippingFee?: number;
  taxFee?: number;
  paymentTerms?: string;
  leadTimeDays?: number;
  validDays?: number;
  supplierNotes?: string;
}

export const quotationService = {
  async createRfq(payload: CreateRfqPayload): Promise<ApiResponse<QuotationRequest>> {
    return apiClient<QuotationRequest>('/quotations/rfq', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getRfqs(params?: { role?: 'buyer' | 'supplier'; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ rfqs: QuotationRequest[]; pagination: any }>> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<{ rfqs: QuotationRequest[]; pagination: any }>(`/quotations/rfqs${qs}`);
  },

  async getRfqDetails(id: string): Promise<ApiResponse<QuotationRequest>> {
    return apiClient<QuotationRequest>(`/quotations/rfqs/${id}`);
  },

  async submitSupplierQuote(id: string, payload: SubmitQuotePayload): Promise<ApiResponse<QuotationVersion>> {
    return apiClient<QuotationVersion>(`/quotations/rfqs/${id}/quote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async requestRevision(id: string, message: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>(`/quotations/rfqs/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async declineRfq(id: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>(`/quotations/rfqs/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async acceptQuotation(id: string, payload: { shippingAddressId?: string; paymentMethod?: string; notes?: string }): Promise<ApiResponse<any>> {
    return apiClient<any>(`/quotations/rfqs/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
