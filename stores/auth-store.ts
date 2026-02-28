import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from '@/lib/storage';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  user: UserProfile | null;
  isLoading: boolean;

  signIn: (user: UserProfile) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  skipAuth: () => void;
  setLoading: (loading: boolean) => void;
}

// Custom storage adapter
const zustandStorage = {
  getItem: (name: string): string | null => appStorage.getString(name) ?? null,
  setItem: (name: string, value: string): void => appStorage.set(name, value),
  removeItem: (name: string): void => appStorage.delete(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasOnboarded: false,
      user: null,
      isLoading: false,

      signIn: (user) => set({ isAuthenticated: true, user }),
      signOut: () => set({ isAuthenticated: false, hasOnboarded: false, user: null }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      skipAuth: () =>
        set({
          isAuthenticated: true,
          hasOnboarded: true,
          user: { id: 'local-user', email: 'local@apex.app', name: 'Athlete' },
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'apex-auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasOnboarded: state.hasOnboarded,
        user: state.user,
      }),
    },
  ),
);
