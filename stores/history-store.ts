import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WorkoutSummaryData } from './workout-store';
import { appStorage } from '@/lib/storage';

interface HistoryState {
  workouts: WorkoutSummaryData[];
  isLoaded: boolean;
  loadFromDB: () => Promise<void>;
  addWorkout: (workout: WorkoutSummaryData) => void;
  clear: () => void;
}

// Custom storage adapter
const zustandStorage = {
  getItem: (name: string): string | null => appStorage.getString(name) ?? null,
  setItem: (name: string, value: string): void => appStorage.set(name, value),
  removeItem: (name: string): void => appStorage.delete(name),
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      workouts: [],
      isLoaded: false,

      loadFromDB: async () => {
        // Will be implemented when integrating with db-history-store
        set({ isLoaded: true });
      },

      addWorkout: (workout) => set((s) => ({ workouts: [workout, ...s.workouts] })),

      clear: () => set({ workouts: [] }),
    }),
    {
      name: 'apex-history',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
