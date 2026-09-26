// api/favoritesApi.ts
// Favorites API client (connects to /api/mobile/favorites)

import { api } from "./authapi";
import type { Contractor } from "../types/home";

export interface FavoriteContractor extends Contractor {
  imageUrl?: string | null;
  favoritedAt?: string;
}

export interface FavoritesResponse {
  success: boolean;
  contractors: FavoriteContractor[];
  ids: number[];
  error?: string;
}

/**
 * GET /api/mobile/favorites — the signed-in user's favorite contractors + ids.
 */
export const getFavorites = async (): Promise<FavoritesResponse> => {
  const response = await api.get<FavoritesResponse>("/api/mobile/favorites");
  return response.data;
};

/**
 * POST /api/mobile/favorites — add a contractor to favorites.
 */
export const addFavorite = async (contractorId: number): Promise<void> => {
  await api.post("/api/mobile/favorites", { contractorId });
};

/**
 * DELETE /api/mobile/favorites/[contractorId] — remove a contractor.
 */
export const removeFavorite = async (contractorId: number): Promise<void> => {
  await api.delete(`/api/mobile/favorites/${contractorId}`);
};
