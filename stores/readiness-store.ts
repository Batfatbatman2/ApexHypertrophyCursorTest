import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { readinessDbService } from '@/lib/sync/database-service';
import { appStorage } from '@/lib/storage';

export interface ReadinessEntry {
  id: string;
  soreness: number;
  sleepQuality: number;
  stressLevel: number;
  energyLevel: number;
  notes: string;
  surveyedAt: number;
}

export type ReadinessMetric = 'soreness' | 'sleepQuality' | 'stressLevel' | 'energyLevel';

function readinessScore(entry: ReadinessEntry): number {
  return Math.round(
    ((5 - entry.soreness + entry.sleepQuality + (5 - entry.stressLevel) + entry.energyLevel) / 20) *
      100,
  );
}

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

let counter = 1;

// Custom storage adapter for Zustand persist using appStorage
const zustandStorage = {
  getItem: (name: string): string | null => {
    return appStorage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    appStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    appStorage.delete(name);
  },
};

interface ReadinessState {
  entries: ReadinessEntry[];
  isLoaded: boolean;
  loadFromDB: () => Promise<void>;
  addEntry: (entry: Omit<ReadinessEntry, 'id' | 'surveyedAt'>) => void;
  getTodayEntry: () => ReadinessEntry | undefined;
  getScore: (entry: ReadinessEntry) => number;
  getLatestEntries: (count: number) => ReadinessEntry[];
}

export const useReadinessStore = create<ReadinessState>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoaded: false,

      loadFromDB: async () => {
        try {
          const dbEntries = await readinessDbService.getAll();
          const entries: ReadinessEntry[] = dbEntries.map((e, idx) => ({
            id: e.id || `loaded-${idx}`,
            soreness: e.soreness,
            sleepQuality: e.sleepQuality,
            stressLevel: e.stressLevel,
            energyLevel: e.energyLevel,
            notes: e.notes,
            surveyedAt: e.surveyedAt,
          }));
          set({ entries, isLoaded: true });
        } catch (e) {
          console.warn('Failed to load readiness from DB:', e);
          set({ isLoaded: true });
        }
      },

      addEntry: async (data) => {
        const entry: ReadinessEntry = {
          ...data,
          id: `readiness-${counter++}`,
          surveyedAt: Date.now(),
        };
        
        // Persist to DB
        await readinessDbService.save({
          soreness: data.soreness,
          sleepQuality: data.sleepQuality,
          stressLevel: data.stressLevel,
          energyLevel: data.energyLevel,
          notes: data.notes,
        });
        
        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      getTodayEntry: () => {
        const start = todayStart();
        return get().entries.find((e) => e.surveyedAt >= start);
      },

      getScore: readinessScore,

      getLatestEntries: (count) => get().entries.slice(0, count),
    }),
    {
      name: 'apex-readiness',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
