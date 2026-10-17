import { apiClient, ApiResponse } from '../lib/api-client';
import { Product } from './catalog.service';

export interface FavoriteItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export const favoriteService = {
  async getFavorites(): Promise<ApiResponse<FavoriteItem[]>> {
    return apiClient<FavoriteItem[]>('/favorites');
  },

  async addFavorite(productId: string): Promise<ApiResponse<FavoriteItem>> {
    return apiClient<FavoriteItem>(`/favorites/${productId}`, {
      method: 'POST',
    });
  },

  async removeFavorite(productId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient<{ message: string }>(`/favorites/${productId}`, {
      method: 'DELETE',
    });
  },

  async checkFavorite(productId: string): Promise<ApiResponse<{ isFavorited: boolean }>> {
    return apiClient<{ isFavorited: boolean }>(`/favorites/check/${productId}`);
  },
};
