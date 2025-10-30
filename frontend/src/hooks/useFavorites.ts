import { create } from 'zustand';
import { ApiService } from '../services/api';
import type { PlaceFavorite } from '../types';

interface FavoritesState {
  favorites: PlaceFavorite[];
  loadFavorites: (userId: number) => Promise<void>;
  addFavorite: (userId: number, placeId: number) => Promise<void>;
  removeFavorite: (userId: number, placeId: number) => Promise<void>;
  toggleFavorite: (userId: number, placeId: number) => Promise<void>;
  isFavorite: (placeId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: [],

  loadFavorites: async (userId: number) => {
    try {
      const favorites = await ApiService.getPlaceFavorites(userId) as PlaceFavorite[];
      set({ favorites: favorites.filter(f => f.active) });
    } catch (error) {
      console.error('Failed to load place favorites:', error);
    }
  },

  addFavorite: async (userId: number, placeId: number) => {
    try {
      const newFavorite = await ApiService.addPlaceFavorite(userId, placeId);
      set((state) => {
        const filtered = state.favorites.filter(f => f.place_id !== placeId);
        return { favorites: [...filtered, newFavorite] };
      });
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  },

  removeFavorite: async (userId: number, placeId: number) => {
    try {
      await ApiService.removePlaceFavorite(userId, placeId);
      set((state) => ({
        favorites: state.favorites.filter(f => f.place_id !== placeId)
      }));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  },

  toggleFavorite: async (userId: number, placeId: number) => {
    const { isFavorite, addFavorite, removeFavorite } = get();
    if (isFavorite(placeId)) {
      await removeFavorite(userId, placeId);
      // Reload favorites from server to ensure sync
      await get().loadFavorites(userId);
    } else {
      await addFavorite(userId, placeId);
    }
  },

  isFavorite: (placeId: number) => {
    return get().favorites.some(f => f.place_id === placeId && f.active);
  },

  clearFavorites: () => set({ favorites: [] }),
}));