import { create } from 'zustand';
import { ApiService } from '../services/api';
import type { PlaceFavorite } from '../types';

export interface FavoritesState {
  favorites: PlaceFavorite[];
  isLoading: boolean;
  loadFavorites: (userId: number) => Promise<void>;
  toggleFavorite: (userId: number, placeId: number) => Promise<void>;
  isFavorite: (placeId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  loadFavorites: async (userId: number) => {
    set({ isLoading: true });
    try {
      const favorites = await ApiService.getPlaceFavorites(userId) as PlaceFavorite[];
      set({ favorites: favorites.filter(f => f.active), isLoading: false });
    } catch (error) {
      console.error('Failed to load place favorites:', error);
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (userId: number, placeId: number) => {
    const { isFavorite } = get();
    const wasFavorite = isFavorite(placeId);
    
    // Optimistically update UI
    if (wasFavorite) {
      set((state) => ({
        favorites: state.favorites.filter(f => f.place_id !== placeId)
      }));
    } else {
      const tempFavorite: PlaceFavorite = {
        id: Date.now(),
        user_id: userId,
        place_id: placeId,
        active: true,
        created_at: new Date().toISOString()
      };
      set((state) => ({
        favorites: [...state.favorites, tempFavorite]
      }));
    }
    
    // Make API call
    try {
      if (wasFavorite) {
        await ApiService.removePlaceFavorite(userId, placeId);
      } else {
        const newFavorite = await ApiService.addPlaceFavorite(userId, placeId);
        // Update with real data from server
        set((state) => ({
          favorites: state.favorites.map(f => 
            f.place_id === placeId && f.id === Date.now() ? newFavorite : f
          )
        }));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      get().loadFavorites(userId);
    }
  },

  isFavorite: (placeId: number) => {
    return get().favorites.some(f => f.place_id === placeId && f.active);
  },

  clearFavorites: () => set({ favorites: [] }),
}));
