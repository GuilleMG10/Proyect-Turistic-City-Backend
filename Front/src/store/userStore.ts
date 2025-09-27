import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserInterest } from '../types';
import { ApiService } from '../services/api';

interface UserState {
  user: User | null;
  interests: UserInterest[];
  setUser: (user: User | null) => void;
  loadUserInterests: () => Promise<void>;
  addInterest: (eventId: number) => Promise<void>;
  removeInterest: (eventId: number) => Promise<void>;
  isInterested: (eventId: number) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      interests: [],

      setUser: (user) => set({ user }),

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
        
        try {
          const newInterest = await ApiService.addUserInterest(user.id, eventId);
          set((state) => ({
            interests: [...state.interests, newInterest],
          }));
        } catch (error) {
          console.error('Failed to add interest:', error);
        }
      },

      removeInterest: async (eventId) => {
        const { user } = get();
        if (!user) return;
        
        try {
          await ApiService.removeUserInterest(user.id, eventId);
          set((state) => ({
            interests: state.interests.filter(interest => interest.event_id !== eventId),
          }));
        } catch (error) {
          console.error('Failed to remove interest:', error);
        }
      },

      isInterested: (eventId) => {
        const { interests } = get();
        return interests.some(interest => interest.event_id === eventId && interest.active);
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

// Temporary function to simulate a user (until authentication is implemented)
export const setTemporaryUser = () => {
  const mockUser: User = {
    id: 1,
    name: "Usuario Demo",
    age: null,
    username: "demo_user",
    password_hash: "mock_hash",
    role_id: null,
    email: "demo@cochabamba.com",
    created_at: new Date().toISOString(),
    active: true
  };
  
  useUserStore.getState().setUser(mockUser);
  return mockUser;
};