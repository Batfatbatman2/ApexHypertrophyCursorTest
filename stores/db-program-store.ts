import { create } from 'zustand';
import {
  programService,
  workoutDayService,
  programExerciseService,
  type ProgramGoal,
  type ScheduleType,
} from '@/db/services/program-service';
import Program from '@/db/models/Program';
import WorkoutDay from '@/db/models/WorkoutDay';
import ProgramExercise from '@/db/models/ProgramExercise';

export interface WorkoutExercise {
  exerciseName: string;
  muscleGroups: string[];
  equipment: string;
  sets: number;
  reps: number;
  setType: string;
}

export interface WorkoutDayData {
  id: string;
  name: string;
  isRestDay: boolean;
  exercises: WorkoutExercise[];
}

export interface ProgramData {
  id: string;
  name: string;
  description: string;
  goal: ProgramGoal;
  scheduleType: ScheduleType;
  isActive: boolean;
  workoutDays: WorkoutDayData[];
  createdAt: number;
}

interface WizardState {
  step: number;
  name: string;
  description: string;
  goal: ProgramGoal | null;
  workoutDays: WorkoutDayData[];
}

interface ProgramState {
  programs: ProgramData[];
  activeProgram: ProgramData | null;
  isLoading: boolean;
  error: string | null;
  wizard: WizardState;
  editingProgramId: string | null;

  // Actions
  loadPrograms: (userId: string) => Promise<void>;
  loadActiveProgram: (userId: string) => Promise<void>;
  addProgram: (program: ProgramData) => Promise<void>;
  updateProgram: (
    id: string,
    updates: Partial<Omit<ProgramData, 'id' | 'createdAt'>>,
  ) => Promise<void>;
  removeProgram: (id: string) => Promise<void>;
  duplicateProgram: (id: string) => Promise<void>;
  setActive: (id: string, userId: string) => Promise<void>;
  getActiveProgram: () => ProgramData | undefined;

  // Wizard actions
  loadProgramForEdit: (id: string) => void;
  setWizardStep: (step: number) => void;
  setWizardName: (name: string) => void;
  setWizardDescription: (desc: string) => void;
  setWizardGoal: (goal: ProgramGoal) => void;
  addWizardDay: (day: WorkoutDayData) => void;
  removeWizardDay: (id: string) => void;
  reorderWizardDay: (id: string, direction: 'up' | 'down') => void;
  addExerciseToDay: (dayId: string, exercise: WorkoutExercise) => void;
  removeExerciseFromDay: (dayId: string, exerciseIndex: number) => void;
  resetWizard: () => void;
  finishWizard: (userId: string) => Promise<void>;
}

const INITIAL_WIZARD: WizardState = {
  step: 0,
  name: '',
  description: '',
  goal: null,
  workoutDays: [],
};

// Helper to convert DB model to ProgramData
async function programToData(program: Program): Promise<ProgramData> {
  const workoutDays = await workoutDayService.findByProgram(program.id);
  const daysData: WorkoutDayData[] = await Promise.all(
    workoutDays.map(async (day) => {
      const exercises = await programExerciseService.findByWorkoutDay(day.id);
      const exerciseData: WorkoutExercise[] = exercises.map((ex) => ({
        exerciseName: (ex as any).exerciseId, // Would need to lookup exercise name
        muscleGroups: [], // Would need to lookup
        equipment: '', // Would need to lookup
        sets: (ex as any).sets,
        reps: (ex as any).reps,
        setType: (ex as any).setType,
      }));
      return {
        id: day.id,
        name: day.name,
        isRestDay: day.isRestDay,
        exercises: exerciseData,
      };
    }),
  );

  return {
    id: program.id,
    name: program.name,
    description: program.description || '',
    goal: program.goal as ProgramGoal,
    scheduleType: program.scheduleType as ScheduleType,
    isActive: program.isActive,
    workoutDays: daysData,
    createdAt: program.createdAt.getTime(),
  };
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  activeProgram: null,
  isLoading: false,
  error: null,
  wizard: { ...INITIAL_WIZARD },
  editingProgramId: null,

  loadPrograms: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const dbPrograms = await programService.findByUser(userId);
      const programsData = await Promise.all(dbPrograms.map((p) => programToData(p)));
      set({ programs: programsData, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load programs',
        isLoading: false,
      });
    }
  },

  loadActiveProgram: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const active = await programService.findActiveProgram(userId);
      if (active) {
        const programData = await programToData(active);
        set({ activeProgram: programData, isLoading: false });
      } else {
        set({ activeProgram: null, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load active program',
        isLoading: false,
      });
    }
  },

  addProgram: async (program: ProgramData) => {
    set({ isLoading: true, error: null });
    try {
      await programService.createProgram({
        name: program.name,
        description: program.description,
        goal: program.goal,
        scheduleType: program.scheduleType,
        isActive: program.isActive,
        userId: 'local-user',
      });
      await get().loadPrograms('local-user');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add program',
        isLoading: false,
      });
    }
  },

  updateProgram: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await programService.updateProgram(id, updates);
      await get().loadPrograms('local-user');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update program',
        isLoading: false,
      });
    }
  },

  removeProgram: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await programService.deleteProgram(id);
      await get().loadPrograms('local-user');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete program',
        isLoading: false,
      });
    }
  },

  duplicateProgram: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const program = get().programs.find((p) => p.id === id);
      if (program) {
        await programService.duplicateProgram(id, `${program.name} (Copy)`);
        await get().loadPrograms('local-user');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate program',
        isLoading: false,
      });
    }
  },

  setActive: async (id: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await programService.setActive(id, userId);
      await get().loadPrograms(userId);
      await get().loadActiveProgram(userId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to set active program',
        isLoading: false,
      });
    }
  },

  getActiveProgram: () => {
    return get().activeProgram || get().programs.find((p) => p.isActive);
  },

  // Wizard actions
  loadProgramForEdit: (id: string) => {
    const program = get().programs.find((p) => p.id === id);
    if (!program) return;
    set({
      editingProgramId: id,
      wizard: {
        step: 0,
        name: program.name,
        description: program.description,
        goal: program.goal,
        workoutDays: program.workoutDays.map((d) => ({ ...d })),
      },
    });
  },

  setWizardStep: (step: number) => set((s) => ({ wizard: { ...s.wizard, step } })),
  setWizardName: (name: string) => set((s) => ({ wizard: { ...s.wizard, name } })),
  setWizardDescription: (desc: string) =>
    set((s) => ({ wizard: { ...s.wizard, description: desc } })),
  setWizardGoal: (goal: ProgramGoal) => set((s) => ({ wizard: { ...s.wizard, goal } })),

  addWizardDay: (day: WorkoutDayData) =>
    set((s) => ({ wizard: { ...s.wizard, workoutDays: [...s.wizard.workoutDays, day] } })),

  removeWizardDay: (id: string) =>
    set((s) => ({
      wizard: { ...s.wizard, workoutDays: s.wizard.workoutDays.filter((d) => d.id !== id) },
    })),

  reorderWizardDay: (id: string, direction: 'up' | 'down') =>
    set((s) => {
      const days = [...s.wizard.workoutDays];
      const idx = days.findIndex((d) => d.id === id);
      if (idx < 0) return s;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= days.length) return s;
      [days[idx], days[newIdx]] = [days[newIdx], days[idx]];
      return { wizard: { ...s.wizard, workoutDays: days } };
    }),

  addExerciseToDay: (dayId: string, exercise: WorkoutExercise) =>
    set((s) => ({
      wizard: {
        ...s.wizard,
        workoutDays: s.wizard.workoutDays.map((d) =>
          d.id === dayId ? { ...d, exercises: [...d.exercises, exercise] } : d,
        ),
      },
    })),

  removeExerciseFromDay: (dayId: string, exerciseIndex: number) =>
    set((s) => ({
      wizard: {
        ...s.wizard,
        workoutDays: s.wizard.workoutDays.map((d) =>
          d.id === dayId
            ? { ...d, exercises: d.exercises.filter((_, i) => i !== exerciseIndex) }
            : d,
        ),
      },
    })),

  resetWizard: () => set({ wizard: { ...INITIAL_WIZARD }, editingProgramId: null }),

  finishWizard: async (userId: string) => {
    const { wizard, programs, editingProgramId } = get();
    const goal = wizard.goal;
    if (!wizard.name || !goal) return;

    set({ isLoading: true, error: null });

    try {
      if (editingProgramId) {
        await programService.updateProgram(editingProgramId, {
          name: wizard.name,
          description: wizard.description,
          goal,
        });
      } else {
        const newProgram = await programService.createProgram({
          name: wizard.name,
          description: wizard.description,
          goal,
          scheduleType: 'rolling',
          isActive: programs.length === 0,
          userId,
        });

        // Create workout days
        for (const day of wizard.workoutDays) {
          const newDay = await workoutDayService.createWorkoutDay({
            programId: newProgram.id,
            name: day.name,
            dayOrder: wizard.workoutDays.indexOf(day),
            isRestDay: day.isRestDay,
          });

          // Create exercises
          for (const exercise of day.exercises) {
            // Would need to find exercise by name first
            await programExerciseService.createProgramExercise({
              workoutDayId: newDay.id,
              exerciseId: exercise.exerciseName, // Would need to lookup
              exerciseOrder: day.exercises.indexOf(exercise),
              sets: exercise.sets,
              reps: exercise.reps,
              setType: exercise.setType,
            });
          }
        }
      }

      await get().loadPrograms(userId);
      set({ wizard: { ...INITIAL_WIZARD }, editingProgramId: null, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save program',
        isLoading: false,
      });
    }
  },
}));
