import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserInterest } from '../types';
import { ApiService } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';

interface UserState {
  user: User | null;
  token: string | null;
  interests: UserInterest[];
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { name: string; username: string; password: string; email?: string; age?: number }) => Promise<void>;
  logout: () => void;
  loadUserInterests: () => Promise<void>;
  addInterest: (eventId: number) => Promise<void>;
  removeInterest: (eventId: number) => Promise<void>;
  isInterested: (eventId: number) => boolean;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      interests: [],
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await ApiService.login(username, password);
          set({ user: response.user, token: response.token, isLoading: false });
          
          // Load user interests and favorites after login
          await get().loadUserInterests();
          useFavorites.getState().loadFavorites(response.user.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await ApiService.register(data);
          set({ user: response.user, token: response.token, isLoading: false });
          
          // Load user interests and favorites after registration
          await get().loadUserInterests();
          useFavorites.getState().loadFavorites(response.user.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, interests: [], error: null });
        useFavorites.getState().clearFavorites();
      },

      loadUserInterests: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const interests = await ApiService.getUserInterests(user.id);
          set({ interests: interests.filter(interest => interest.active) });
        } catch (error) {
          console.error('Failed to load user interests:', error);
        }
      },

      addInterest: async (eventId) => {
        const { user } = get();
        if (!user) return;
        
        // Optimistically update UI immediately
        const tempInterest: UserInterest = {
          id: Date.now(), // Temporary ID
          user_id: user.id,
          event_id: eventId,
          active: true,
          created_at: new Date().toISOString()
        };
        
        set((state) => ({
          interests: [...state.interests, tempInterest],
        }));
        
        try {
          const newInterest = await ApiService.addUserInterest(user.id, eventId);
          // Replace temp with real interest
          set((state) => ({
            interests: state.interests.map(i => 
              i.id === tempInterest.id ? newInterest : i
            ),
          }));
        } catch (error) {
          console.error('Failed to add interest:', error);
          // Revert on error
          set((state) => ({
            interests: state.interests.filter(i => i.id !== tempInterest.id),
          }));
        }
      },

      removeInterest: async (eventId) => {
        const { user } = get();
        if (!user) return;
        
        // Store the interest before removing (for potential rollback)
        const removedInterest = get().interests.find(i => i.event_id === eventId);
        
        // Optimistically update UI immediately
        set((state) => ({
          interests: state.interests.filter(interest => interest.event_id !== eventId),
        }));
        
        try {
          await ApiService.removeUserInterest(user.id, eventId);
        } catch (error) {
          console.error('Failed to remove interest:', error);
          // Revert on error
          if (removedInterest) {
            set((state) => ({
              interests: [...state.interests, removedInterest],
            }));
          }
        }
      },

      isInterested: (eventId) => {
        const { interests } = get();
        return interests.some(interest => interest.event_id === eventId && interest.active);
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role_id === 1;
      },
    }),
    {
      name: 'user-storage',
    }
  )
);