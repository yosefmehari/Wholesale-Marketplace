import { apiClient, ApiResponse } from '../lib/api-client';
import { UserRole, UserStatus, BusinessType } from '../types';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateBusinessInput {
  name: string;
  businessType: BusinessType;
  tinNumber?: string;
  registrationNumber?: string;
  email: string;
  phone: string;
  city?: string;
  subCity?: string;
  woreda?: string;
  addressLine: string;
  description?: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<ApiResponse<AuthResult>> {
    return apiClient<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async login(input: LoginInput): Promise<ApiResponse<AuthResult>> {
    return apiClient<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getMe(accessToken: string): Promise<ApiResponse<User>> {
    return apiClient<User>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async logout(accessToken: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async createBusiness(
    accessToken: string,
    input: CreateBusinessInput
  ): Promise<ApiResponse<unknown>> {
    return apiClient('/businesses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
  },
};
