import { apiClient, ApiResponse } from '../lib/api-client';

export interface SupplierSettlement {
  id: string;
  settlementNumber: string;
  supplierProfileId: string;
  orderId: string;
  grossOrderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netPayoutAmount: number;
  status: 'PENDING' | 'CALCULATED' | 'PAID' | 'WITHHELD';
  paidAt?: string | null;
  payoutReference?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
}

export interface SettlementsResponse {
  settlements: SupplierSettlement[];
  summary: {
    totalPendingPayout: number;
    totalCommissionDeducted: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export const settlementService = {
  async getSupplierSettlements(params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<SettlementsResponse>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<SettlementsResponse>(`/settlements${qs}`);
  },

  async markSettlementPayout(id: string, payoutReference: string): Promise<ApiResponse<SupplierSettlement>> {
    return apiClient<SupplierSettlement>(`/settlements/${id}/payout`, {
      method: 'PATCH',
      body: JSON.stringify({ payoutReference }),
    });
  },
};
