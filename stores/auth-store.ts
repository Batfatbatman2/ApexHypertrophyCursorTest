import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
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
      user: { id: 'demo', email: 'demo@apex.app', name: 'Athlete' },
    }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
