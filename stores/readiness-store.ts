import { create } from 'zustand';

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

interface ReadinessState {
  entries: ReadinessEntry[];
  addEntry: (entry: Omit<ReadinessEntry, 'id' | 'surveyedAt'>) => void;
  getTodayEntry: () => ReadinessEntry | undefined;
  getScore: (entry: ReadinessEntry) => number;
  getLatestEntries: (count: number) => ReadinessEntry[];
}

export const useReadinessStore = create<ReadinessState>((set, get) => ({
  entries: [],

  addEntry: (data) => {
    const entry: ReadinessEntry = {
      ...data,
      id: `readiness-${counter++}`,
      surveyedAt: Date.now(),
    };
    set((s) => ({ entries: [entry, ...s.entries] }));
  },

  getTodayEntry: () => {
    const start = todayStart();
    return get().entries.find((e) => e.surveyedAt >= start);
  },

  getScore: readinessScore,

  getLatestEntries: (count) => get().entries.slice(0, count),
}));
