import { apiClient, ApiResponse } from '../lib/api-client';

export interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    issuedDate: string;
    dueDate?: string | null;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    currency: string;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    totalAmount: number;
    status: string;
  };
  supplier: {
    name: string;
    tinNumber: string;
    registrationNumber: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    subCity?: string | null;
  };
  buyer: {
    name: string;
    tinNumber?: string | null;
    email: string;
    phone: string;
    address?: any;
  };
  items: Array<{
    id: string;
    productName: string;
    sku?: string | null;
    wholesaleUnit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  payment?: {
    paymentNumber: string;
    paymentMethod: string;
    transactionReference?: string | null;
    verifiedAt?: string | null;
  } | null;
}

export const invoiceService = {
  async getInvoiceByOrder(orderId: string): Promise<ApiResponse<InvoiceData>> {
    return apiClient<InvoiceData>(`/invoices/${orderId}`);
  },
};
