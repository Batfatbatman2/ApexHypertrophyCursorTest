import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WorkoutSummaryData } from './workout-store';
import { prDbService } from '@/lib/sync/database-service';
import { appStorage } from '@/lib/storage';

export type PRType = 'weight' | 'reps' | 'volume';

export interface PersonalRecord {
  exerciseName: string;
  prType: PRType;
  value: number;
  weight: number;
  reps: number;
  achievedAt: number;
}

export interface ExercisePRHistory {
  exerciseName: string;
  weightPR: PersonalRecord | null;
  repsPR: PersonalRecord | null;
  volumePR: PersonalRecord | null;
  history: PersonalRecord[];
}

interface PRState {
  records: Record<string, ExercisePRHistory>;
  totalPRCount: number;
  isLoaded: boolean;
  loadFromDB: () => Promise<void>;
  buildFromHistory: (workouts: WorkoutSummaryData[]) => void;
  checkForPR: (exerciseName: string, weight: number, reps: number) => { isNewPR: boolean; types: PRType[] };
  getExercisePRs: (exerciseName: string) => ExercisePRHistory | null;
  getAllPRs: () => PersonalRecord[];
}

function prKey(name: string): string {
  return name.toLowerCase().trim();
}

// Custom storage adapter
const zustandStorage = {
  getItem: (name: string): string | null => appStorage.getString(name) ?? null,
  setItem: (name: string, value: string): void => appStorage.set(name, value),
  removeItem: (name: string): void => appStorage.delete(name),
};

export const usePRStore = create<PRState>()(
  persist(
    (set, get) => ({
      records: {},
      totalPRCount: 0,
      isLoaded: false,

      loadFromDB: async () => {
        try {
          const dbRecords = await prDbService.getAll();
          const records: Record<string, ExercisePRHistory> = {};

          for (const pr of dbRecords) {
            const key = prKey(pr.exerciseId);
            if (!records[key]) {
              records[key] = { exerciseName: pr.exerciseId, weightPR: null, repsPR: null, volumePR: null, history: [] };
            }
            const rec = records[key];
            const newPR: PersonalRecord = {
              exerciseName: pr.exerciseId,
              prType: pr.prType as PRType,
              value: pr.value,
              weight: pr.weight,
              reps: pr.reps,
              achievedAt: pr.achievedAt,
            };
            if (pr.prType === 'weight') rec.weightPR = newPR;
            else if (pr.prType === 'reps') rec.repsPR = newPR;
            else if (pr.prType === 'volume') rec.volumePR = newPR;
            rec.history.push(newPR);
          }

          const totalPRCount = Object.values(records).reduce(
            (sum, r) => sum + (r.weightPR ? 1 : 0) + (r.repsPR ? 1 : 0) + (r.volumePR ? 1 : 0), 0
          );
          set({ records, totalPRCount, isLoaded: true });
        } catch (e) {
          console.warn('Failed to load PRs from DB:', e);
          set({ isLoaded: true });
        }
      },

      buildFromHistory: (workouts) => {
        const records: Record<string, ExercisePRHistory> = {};
        let total = 0;
        const sorted = [...workouts].sort((a, b) => a.completedAt - b.completedAt);

        for (const workout of sorted) {
          for (const ex of workout.exercises) {
            if (ex.completedSets === 0) continue;
            const key = prKey(ex.exerciseName);
            if (!records[key]) {
              records[key] = { exerciseName: ex.exerciseName, weightPR: null, repsPR: null, volumePR: null, history: [] };
            }
            const rec = records[key];
            const w = ex.topWeight, r = ex.topReps;
            if (w > 0 && r > 0) {
              const vol = ex.totalVolume;
              if (!rec.weightPR || w > rec.weightPR.value) {
                const pr: PersonalRecord = { exerciseName: ex.exerciseName, prType: 'weight', value: w, weight: w, reps: r, achievedAt: workout.completedAt };
                rec.weightPR = pr; rec.history.push(pr); total++;
              }
              if (!rec.repsPR || r > rec.repsPR.value) {
                const pr: PersonalRecord = { exerciseName: ex.exerciseName, prType: 'reps', value: r, weight: w, reps: r, achievedAt: workout.completedAt };
                rec.repsPR = pr; rec.history.push(pr); total++;
              }
              if (vol > 0 && (!rec.volumePR || vol > rec.volumePR.value)) {
                const pr: PersonalRecord = { exerciseName: ex.exerciseName, prType: 'volume', value: vol, weight: w, reps: r, achievedAt: workout.completedAt };
                rec.volumePR = pr; rec.history.push(pr); total++;
              }
            }
          }
        }
        set({ records, totalPRCount: total });
      },

      checkForPR: (exerciseName, weight, reps) => {
        if (weight <= 0 || reps <= 0) return { isNewPR: false, types: [] };
        const key = prKey(exerciseName);
        const rec = get().records[key];
        const types: PRType[] = [];
        const vol = weight * reps;
        if (!rec) return { isNewPR: true, types: ['weight', 'reps', 'volume'] };
        if (!rec.weightPR || weight > rec.weightPR.value) types.push('weight');
        if (!rec.repsPR || reps > rec.repsPR.value) types.push('reps');
        if (!rec.volumePR || vol > rec.volumePR.value) types.push('volume');
        return { isNewPR: types.length > 0, types };
      },

      getExercisePRs: (exerciseName) => get().records[prKey(exerciseName)] ?? null,

      getAllPRs: () => {
        const all: PersonalRecord[] = [];
        for (const rec of Object.values(get().records)) {
          if (rec.weightPR) all.push(rec.weightPR);
          if (rec.repsPR) all.push(rec.repsPR);
          if (rec.volumePR) all.push(rec.volumePR);
        }
        return all.sort((a, b) => b.achievedAt - a.achievedAt);
      },
    }),
    { name: 'apex-prs', storage: createJSONStorage(() => zustandStorage) }
  )
);
