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
  isCompleted: boolean;
  parentSetId: string | null;
}

export interface ActiveExercise {
  exerciseName: string;
  muscleGroups: string[];
  equipment: string;
  sets: ActiveSet[];
}

interface WorkoutState {
  status: SessionStatus;
  workoutName: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  startTime: number | null;
  elapsedSeconds: number;

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

export function buildSetsForExercise(numSets: number, reps: number): ActiveSet[] {
  return Array.from({ length: numSets }, (_, i) => ({
    id: genSetId(),
    setNumber: i + 1,
    setType: 'working' as SetType,
    weight: 0,
    reps,
    rpe: null,
    isCompleted: false,
    parentSetId: null,
  }));
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  status: 'idle',
  workoutName: '',
  exercises: [],
  currentExerciseIndex: 0,
  startTime: null,
  elapsedSeconds: 0,

  startWorkout: (name, exercises) =>
    set({
      status: 'active',
      workoutName: name,
      exercises,
      currentExerciseIndex: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
    }),

  endWorkout: () => set({ status: 'completed' }),

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
          isCompleted: false,
          parentSetId: null,
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
        setNumber: dropCount + 1,
        setType: 'dropSet',
        weight: 0,
        reps: 0,
        rpe: null,
        isCompleted: false,
        parentSetId,
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
    }),
}));
