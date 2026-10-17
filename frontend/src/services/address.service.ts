import { apiClient, ApiResponse } from '../lib/api-client';

export interface Address {
  id: string;
  userId?: string;
  recipientName: string;
  phoneNumber: string;
  country: string;
  city: string;
  subCity: string | null;
  woreda: string | null;
  kebele: string | null;
  houseNumber: string | null;
  landmark: string | null;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressPayload {
  recipientName: string;
  phoneNumber: string;
  country?: string;
  city?: string;
  subCity: string;
  woreda?: string;
  kebele?: string;
  houseNumber?: string;
  landmark?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export const addressService = {
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return apiClient<Address[]>('/addresses');
  },

  async createAddress(data: CreateAddressPayload): Promise<ApiResponse<Address>> {
    return apiClient<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAddress(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  },
};
