import { create } from 'zustand';
import { exerciseService, type ExerciseService } from '@/db/services/exercise-service';
import Exercise from '@/db/models/Exercise';

interface ExerciseState {
  exercises: Exercise[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loadExercises: () => Promise<void>;
  getExerciseByName: (name: string) => Promise<Exercise | null>;
  getExercisesByMuscleGroup: (muscleGroup: string) => Promise<Exercise[]>;
  getExercisesByEquipment: (equipment: string) => Promise<Exercise[]>;
  createCustomExercise: (data: {
    name: string;
    muscleGroups: string[];
    equipment: string;
    movementPattern: string;
    isCompound: boolean;
    sfrRating: number;
    cues?: string;
  }) => Promise<Exercise>;
  updateExerciseStatus: (
    id: string,
    status: 'proven' | 'experimental' | 'blacklisted',
  ) => Promise<void>;
  getEquipmentList: () => string[];
  getMuscleGroupsList: () => string[];
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });
    try {
      const count = await exerciseService.seedDefaultExercises();
      await get().loadExercises();
      set({ isInitialized: true, isLoading: false });
      console.log(`[ExerciseStore] Initialized with ${count} exercises`);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize',
        isLoading: false,
      });
    }
  },

  loadExercises: async () => {
    set({ isLoading: true, error: null });
    try {
      const exercises = await exerciseService.findAll();
      set({ exercises, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load exercises',
        isLoading: false,
      });
    }
  },

  getExerciseByName: async (name: string) => {
    return exerciseService.findByName(name);
  },

  getExercisesByMuscleGroup: async (muscleGroup: string) => {
    return exerciseService.findByMuscleGroup(muscleGroup);
  },

  getExercisesByEquipment: async (equipment: string) => {
    return exerciseService.findByEquipment(equipment);
  },

  createCustomExercise: async (data) => {
    const exercise = await exerciseService.createCustomExercise('local-user', data);
    await get().loadExercises();
    return exercise;
  },

  updateExerciseStatus: async (id, status) => {
    await exerciseService.updateExerciseStatus(id, status);
    await get().loadExercises();
  },

  getEquipmentList: () => {
    return exerciseService.getEquipmentList();
  },

  getMuscleGroupsList: () => {
    return exerciseService.getMuscleGroupsList();
  },
}));
