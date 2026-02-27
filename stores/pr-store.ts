import { create } from 'zustand';
import type { WorkoutSummaryData } from './workout-store';

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

  buildFromHistory: (workouts: WorkoutSummaryData[]) => void;
  checkForPR: (
    exerciseName: string,
    weight: number,
    reps: number,
  ) => { isNewPR: boolean; types: PRType[] };
  getExercisePRs: (exerciseName: string) => ExercisePRHistory | null;
  getAllPRs: () => PersonalRecord[];
}

function prKey(name: string): string {
  return name.toLowerCase().trim();
}

export const usePRStore = create<PRState>((set, get) => ({
  records: {},
  totalPRCount: 0,

  buildFromHistory: (workouts) => {
    const records: Record<string, ExercisePRHistory> = {};
    let total = 0;

    const sorted = [...workouts].sort((a, b) => a.completedAt - b.completedAt);

    for (const workout of sorted) {
      for (const ex of workout.exercises) {
        const completed = ex.sets.filter((s) => s.isCompleted);
        if (completed.length === 0) continue;

        const key = prKey(ex.exerciseName);
        if (!records[key]) {
          records[key] = {
            exerciseName: ex.exerciseName,
            weightPR: null,
            repsPR: null,
            volumePR: null,
            history: [],
          };
        }

        const rec = records[key];

        for (const s of completed) {
          if (s.weight <= 0 || s.reps <= 0) continue;
          const vol = s.weight * s.reps;

          if (!rec.weightPR || s.weight > rec.weightPR.value) {
            const pr: PersonalRecord = {
              exerciseName: ex.exerciseName,
              prType: 'weight',
              value: s.weight,
              weight: s.weight,
              reps: s.reps,
              achievedAt: workout.completedAt,
            };
            rec.weightPR = pr;
            rec.history.push(pr);
            total++;
          }

          if (!rec.repsPR || s.reps > rec.repsPR.value) {
            const pr: PersonalRecord = {
              exerciseName: ex.exerciseName,
              prType: 'reps',
              value: s.reps,
              weight: s.weight,
              reps: s.reps,
              achievedAt: workout.completedAt,
            };
            rec.repsPR = pr;
            rec.history.push(pr);
            total++;
          }

          if (!rec.volumePR || vol > rec.volumePR.value) {
            const pr: PersonalRecord = {
              exerciseName: ex.exerciseName,
              prType: 'volume',
              value: vol,
              weight: s.weight,
              reps: s.reps,
              achievedAt: workout.completedAt,
            };
            rec.volumePR = pr;
            rec.history.push(pr);
            total++;
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

    if (!rec) {
      return { isNewPR: true, types: ['weight', 'reps', 'volume'] };
    }

    if (!rec.weightPR || weight > rec.weightPR.value) types.push('weight');
    if (!rec.repsPR || reps > rec.repsPR.value) types.push('reps');
    if (!rec.volumePR || vol > rec.volumePR.value) types.push('volume');

    return { isNewPR: types.length > 0, types };
  },

  getExercisePRs: (exerciseName) => {
    return get().records[prKey(exerciseName)] ?? null;
  },

  getAllPRs: () => {
    const all: PersonalRecord[] = [];
    for (const rec of Object.values(get().records)) {
      if (rec.weightPR) all.push(rec.weightPR);
      if (rec.repsPR) all.push(rec.repsPR);
      if (rec.volumePR) all.push(rec.volumePR);
    }
    return all.sort((a, b) => b.achievedAt - a.achievedAt);
  },
}));
