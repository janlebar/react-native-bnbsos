// lib/favorites-context.tsx
// Global favorites state: favorite ids + full contractor list, shared by
// contractor cards, the detail screen and the favorites screen.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { useAuth } from "./auth-context";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  type FavoriteContractor,
} from "../api/favoritesApi";

interface FavoritesContextType {
  favoriteIds: Set<number>;
  contractors: FavoriteContractor[];
  isLoading: boolean;
  /** True only for signed-in users who are NOT in contractor mode. */
  canUseFavorites: boolean;
  isFavorite: (contractorId: number) => boolean;
  toggleFavorite: (contractorId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [contractors, setContractors] = useState<FavoriteContractor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Favorites are a customer-facing feature: unavailable in contractor mode
  // (matches the web profile menu, which hides Favorites for contractors).
  const canUseFavorites = isAuthenticated && !user?.isContractor;

  const refresh = useCallback(async () => {
    if (!canUseFavorites) {
      setFavoriteIds(new Set());
      setContractors([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getFavorites();
      setContractors(data.contractors || []);
      setFavoriteIds(new Set(data.ids || []));
    } catch (error) {
      console.error("[Favorites] Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canUseFavorites]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (contractorId: number) => favoriteIds.has(contractorId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (contractorId: number) => {
      if (!canUseFavorites) {
        return;
      }

      const wasFavorited = favoriteIds.has(contractorId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(contractorId);
        else next.add(contractorId);
        return next;
      });

      try {
        if (wasFavorited) {
          await removeFavorite(contractorId);
          setContractors((prev) =>
            prev.filter((c) => c.id !== contractorId)
          );
        } else {
          await addFavorite(contractorId);
          // Re-fetch so the favorites screen has full contractor data.
          const data = await getFavorites();
          setContractors(data.contractors || []);
          setFavoriteIds(new Set(data.ids || []));
        }
      } catch (error) {
        console.error("[Favorites] Error toggling favorite:", error);
        // Revert optimistic update
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(contractorId);
          else next.delete(contractorId);
          return next;
        });
        Alert.alert("Error", "Failed to update favorites. Please try again.");
      }
    },
    [favoriteIds, canUseFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        contractors,
        isLoading,
        canUseFavorites,
        isFavorite,
        toggleFavorite,
        refresh,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
