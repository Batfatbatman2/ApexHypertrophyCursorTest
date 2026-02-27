import { create } from 'zustand';
import type { SetType } from '@/constants/set-types';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completing' | 'completed';

export interface ActiveSet {
  id: string;
  setNumber: number;
  setType: SetType;
  weight: number;
  reps: number;
  rpe: number | null;
  muscleConnection: number | null;
  isCompleted: boolean;
  parentSetId: string | null;
  notes: string;
  ghostWeight: number | null;
  ghostReps: number | null;
}

export interface ActiveExercise {
  exerciseName: string;
  muscleGroups: string[];
  equipment: string;
  sets: ActiveSet[];
}

export interface ExerciseSummary {
  exerciseName: string;
  muscleGroups: string[];
  equipment: string;
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  topWeight: number;
  topReps: number;
  avgRpe: number | null;
  sets: ActiveSet[];
}

export interface WorkoutSummaryData {
  workoutName: string;
  durationSeconds: number;
  totalVolume: number;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  averageRpe: number | null;
  exercises: ExerciseSummary[];
  completedAt: number;
  prs: PRRecord[];
}

export interface PRRecord {
  exerciseName: string;
  prType: 'weight' | 'reps' | 'volume';
  value: number;
  weight: number;
  reps: number;
}

interface WorkoutState {
  status: SessionStatus;
  workoutName: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  startTime: number | null;
  elapsedSeconds: number;
  completedSummary: WorkoutSummaryData | null;

  startWorkout: (name: string, exercises: ActiveExercise[]) => void;
  endWorkout: () => void;
  setCurrentExercise: (index: number) => void;
  nextExercise: () => void;
  prevExercise: () => void;

  updateSet: (exerciseIndex: number, setId: string, updates: Partial<ActiveSet>) => void;
  completeSet: (exerciseIndex: number, setId: string) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setId: string) => void;
  changeSetType: (exerciseIndex: number, setId: string, newType: SetType) => void;
  addDropSet: (exerciseIndex: number, parentSetId: string) => void;

  tick: () => void;
  reset: () => void;
}

let setCounter = 1;
const genSetId = () => `set-${setCounter++}`;

export function buildSetsForExercise(
  numSets: number,
  reps: number,
  ghostData?: { weight: number; reps: number }[],
): ActiveSet[] {
  return Array.from({ length: numSets }, (_, i) => {
    const ghost = ghostData?.[i];
    return {
      id: genSetId(),
      setNumber: i + 1,
      setType: 'working' as SetType,
      weight: ghost?.weight ?? 0,
      reps: ghost?.reps ?? reps,
      rpe: null,
      muscleConnection: null,
      isCompleted: false,
      parentSetId: null,
      notes: '',
      ghostWeight: ghost?.weight ?? null,
      ghostReps: ghost?.reps ?? null,
    };
  });
}

function buildSummary(state: {
  workoutName: string;
  exercises: ActiveExercise[];
  elapsedSeconds: number;
}): WorkoutSummaryData {
  const exerciseSummaries: ExerciseSummary[] = state.exercises.map((ex) => {
    const completed = ex.sets.filter((s) => s.isCompleted);
    const rpeValues = completed.map((s) => s.rpe).filter((v): v is number => v !== null);
    const totalVolume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const topWeight = completed.length > 0 ? Math.max(...completed.map((s) => s.weight)) : 0;
    const topReps = completed.length > 0 ? Math.max(...completed.map((s) => s.reps)) : 0;

    return {
      exerciseName: ex.exerciseName,
      muscleGroups: ex.muscleGroups,
      equipment: ex.equipment,
      completedSets: completed.length,
      totalSets: ex.sets.length,
      totalVolume,
      topWeight,
      topReps,
      avgRpe: rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null,
      sets: ex.sets,
    };
  });

  const allCompleted = state.exercises.flatMap((ex) => ex.sets.filter((s) => s.isCompleted));
  const allRpe = allCompleted.map((s) => s.rpe).filter((v): v is number => v !== null);
  const totalVolume = allCompleted.reduce((sum, s) => sum + s.weight * s.reps, 0);

  const prs: PRRecord[] = [];
  for (const ex of exerciseSummaries) {
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) continue;

    const maxWeight = Math.max(...completed.map((s) => s.weight));
    const maxWeightSet = completed.find((s) => s.weight === maxWeight);
    if (maxWeightSet && maxWeight > 0) {
      prs.push({
        exerciseName: ex.exerciseName,
        prType: 'weight',
        value: maxWeight,
        weight: maxWeightSet.weight,
        reps: maxWeightSet.reps,
      });
    }

    const maxVolume = Math.max(...completed.map((s) => s.weight * s.reps));
    const maxVolumeSet = completed.find((s) => s.weight * s.reps === maxVolume);
    if (maxVolumeSet && maxVolume > 0) {
      prs.push({
        exerciseName: ex.exerciseName,
        prType: 'volume',
        value: maxVolume,
        weight: maxVolumeSet.weight,
        reps: maxVolumeSet.reps,
      });
    }
  }

  return {
    workoutName: state.workoutName,
    durationSeconds: state.elapsedSeconds,
    totalVolume,
    totalSetsCompleted: allCompleted.length,
    totalSetsPlanned: state.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    averageRpe: allRpe.length > 0 ? allRpe.reduce((a, b) => a + b, 0) / allRpe.length : null,
    exercises: exerciseSummaries,
    completedAt: Date.now(),
    prs,
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  status: 'idle',
  workoutName: '',
  exercises: [],
  currentExerciseIndex: 0,
  startTime: null,
  elapsedSeconds: 0,
  completedSummary: null,

  startWorkout: (name, exercises) =>
    set({
      status: 'active',
      workoutName: name,
      exercises,
      currentExerciseIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
      completedSummary: null,
    }),

  endWorkout: () => {
    const state = get();
    const summary = buildSummary(state);
    set({ status: 'completed', completedSummary: summary });
  },

  setCurrentExercise: (index) => set({ currentExerciseIndex: index }),
  nextExercise: () => {
    const { currentExerciseIndex, exercises } = get();
    if (currentExerciseIndex < exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },
  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },

  updateSet: (exerciseIndex, setId, updates) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      ex.sets = ex.sets.map((st) => (st.id === setId ? { ...st, ...updates } : st));
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  completeSet: (exerciseIndex, setId) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      ex.sets = ex.sets.map((st) => (st.id === setId ? { ...st, isCompleted: true } : st));
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  addSet: (exerciseIndex) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      const lastSet = ex.sets.filter((st) => !st.parentSetId).pop();
      ex.sets = [
        ...ex.sets,
        {
          id: genSetId(),
          setNumber: ex.sets.filter((st) => !st.parentSetId).length + 1,
          setType: lastSet?.setType ?? 'working',
          weight: 0,
          reps: lastSet?.reps ?? 8,
          rpe: null,
          muscleConnection: null,
          isCompleted: false,
          parentSetId: null,
          notes: '',
          ghostWeight: null,
          ghostReps: null,
        },
      ];
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  removeSet: (exerciseIndex, setId) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      ex.sets = ex.sets.filter((st) => st.id !== setId && st.parentSetId !== setId);
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  changeSetType: (exerciseIndex, setId, newType) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      ex.sets = ex.sets.map((st) => (st.id === setId ? { ...st, setType: newType } : st));
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  addDropSet: (exerciseIndex, parentSetId) =>
    set((s) => {
      const exercises = [...s.exercises];
      const ex = { ...exercises[exerciseIndex] };
      const dropCount = ex.sets.filter((st) => st.parentSetId === parentSetId).length;
      const parentIdx = ex.sets.findIndex((st) => st.id === parentSetId);
      const newSet: ActiveSet = {
        id: genSetId(),
        muscleConnection: null,
        setNumber: dropCount + 1,
        setType: 'dropSet',
        weight: 0,
        reps: 0,
        rpe: null,
        isCompleted: false,
        parentSetId,
        notes: '',
        ghostWeight: null,
        ghostReps: null,
      };
      const newSets = [...ex.sets];
      newSets.splice(parentIdx + 1 + dropCount, 0, newSet);
      ex.sets = newSets;
      exercises[exerciseIndex] = ex;
      return { exercises };
    }),

  tick: () => {
    const { startTime } = get();
    if (startTime) {
      set({ elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
    }
  },

  reset: () =>
    set({
      status: 'idle',
      workoutName: '',
      exercises: [],
      currentExerciseIndex: 0,
      startTime: null,
      elapsedSeconds: 0,
      completedSummary: null,
    }),
}));
