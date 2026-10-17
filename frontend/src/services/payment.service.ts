import { apiClient, ApiResponse } from '../lib/api-client';

export type PaymentMethod =
  | 'TELEBIRR'
  | 'CBE_BIRR'
  | 'BANK_TRANSFER'
  | 'CASH_ON_DELIVERY'
  | 'OTHER';

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PaymentEvent {
  id: string;
  eventType: string;
  payload?: any;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentNumber: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionReference?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  events?: PaymentEvent[];
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}

export interface InitiatePaymentResponse {
  payment: Payment;
  paymentUrl?: string;
  instructions?: {
    accounts: BankAccountInfo[];
    referenceInstruction: string;
  };
}

export const paymentService = {
  async initiatePayment(orderId: string, paymentMethod: PaymentMethod): Promise<ApiResponse<InitiatePaymentResponse>> {
    return apiClient<InitiatePaymentResponse>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod }),
    });
  },

  async submitPaymentProof(paymentId: string, transactionReference: string, notes?: string): Promise<ApiResponse<Payment>> {
    return apiClient<Payment>('/payments/submit-proof', {
      method: 'POST',
      body: JSON.stringify({ paymentId, transactionReference, notes }),
    });
  },

  async verifyPayment(paymentId: string): Promise<ApiResponse<any>> {
    return apiClient<any>(`/payments/${paymentId}/verify`, {
      method: 'POST',
    });
  },

  async getOrderPayments(orderId: string): Promise<ApiResponse<Payment[]>> {
    return apiClient<Payment[]>(`/payments/order/${orderId}`);
  },
};
