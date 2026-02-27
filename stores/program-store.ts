import { create } from 'zustand';

export type ProgramGoal = 'hypertrophy' | 'strength' | 'endurance' | 'general';
export type ScheduleType = 'rolling' | 'fixed';

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
  wizard: WizardState;
  editingProgramId: string | null;

  addProgram: (program: ProgramData) => void;
  updateProgram: (id: string, updates: Partial<Omit<ProgramData, 'id' | 'createdAt'>>) => void;
  removeProgram: (id: string) => void;
  duplicateProgram: (id: string) => void;
  setActive: (id: string) => void;
  getActiveProgram: () => ProgramData | undefined;

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
  finishWizard: () => void;
}

const INITIAL_WIZARD: WizardState = {
  step: 0,
  name: '',
  description: '',
  goal: null,
  workoutDays: [],
};

let nextId = 100;
const genId = () => String(nextId++);

const DEMO_PROGRAMS: ProgramData[] = [
  {
    id: '1',
    name: 'Push',
    description: 'Peas and stuff',
    goal: 'hypertrophy',
    scheduleType: 'rolling',
    isActive: true,
    workoutDays: [
      {
        id: 'wd1',
        name: 'Push',
        isRestDay: false,
        exercises: [
          {
            exerciseName: 'Barbell Bench Press',
            muscleGroups: ['chest'],
            equipment: 'barbell',
            sets: 4,
            reps: 8,
            setType: 'working',
          },
          {
            exerciseName: 'Incline Dumbbell Press',
            muscleGroups: ['chest'],
            equipment: 'dumbbell',
            sets: 3,
            reps: 10,
            setType: 'working',
          },
          {
            exerciseName: 'Cable Crossover',
            muscleGroups: ['chest'],
            equipment: 'cable',
            sets: 3,
            reps: 12,
            setType: 'working',
          },
          {
            exerciseName: 'Overhead Press',
            muscleGroups: ['shoulders'],
            equipment: 'barbell',
            sets: 3,
            reps: 8,
            setType: 'working',
          },
          {
            exerciseName: 'Lateral Raise',
            muscleGroups: ['shoulders'],
            equipment: 'dumbbell',
            sets: 3,
            reps: 15,
            setType: 'working',
          },
          {
            exerciseName: 'Tricep Pushdown',
            muscleGroups: ['triceps'],
            equipment: 'cable',
            sets: 3,
            reps: 12,
            setType: 'working',
          },
        ],
      },
      {
        id: 'wd2',
        name: 'Legs',
        isRestDay: false,
        exercises: [
          {
            exerciseName: 'Barbell Back Squat',
            muscleGroups: ['quads'],
            equipment: 'barbell',
            sets: 4,
            reps: 6,
            setType: 'working',
          },
          {
            exerciseName: 'Leg Press',
            muscleGroups: ['quads'],
            equipment: 'machine',
            sets: 3,
            reps: 10,
            setType: 'working',
          },
          {
            exerciseName: 'Romanian Deadlift',
            muscleGroups: ['hamstrings'],
            equipment: 'barbell',
            sets: 3,
            reps: 10,
            setType: 'working',
          },
          {
            exerciseName: 'Leg Extension',
            muscleGroups: ['quads'],
            equipment: 'machine',
            sets: 3,
            reps: 12,
            setType: 'working',
          },
        ],
      },
    ],
    createdAt: Date.now() - 86400000 * 7,
  },
];

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: DEMO_PROGRAMS,
  wizard: { ...INITIAL_WIZARD },
  editingProgramId: null,

  addProgram: (program) => set((s) => ({ programs: [...s.programs, program] })),
  updateProgram: (id, updates) =>
    set((s) => ({
      programs: s.programs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removeProgram: (id) => set((s) => ({ programs: s.programs.filter((p) => p.id !== id) })),
  duplicateProgram: (id) => {
    const program = get().programs.find((p) => p.id === id);
    if (!program) return;
    const newProgram: ProgramData = {
      ...program,
      id: genId(),
      name: `${program.name} (Copy)`,
      isActive: false,
      createdAt: Date.now(),
      workoutDays: program.workoutDays.map((d) => ({ ...d, id: genId() })),
    };
    set((s) => ({ programs: [...s.programs, newProgram] }));
  },
  setActive: (id) =>
    set((s) => ({
      programs: s.programs.map((p) => ({ ...p, isActive: p.id === id })),
    })),
  getActiveProgram: () => get().programs.find((p) => p.isActive),

  loadProgramForEdit: (id) => {
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
  setWizardStep: (step) => set((s) => ({ wizard: { ...s.wizard, step } })),
  setWizardName: (name) => set((s) => ({ wizard: { ...s.wizard, name } })),
  setWizardDescription: (desc) => set((s) => ({ wizard: { ...s.wizard, description: desc } })),
  setWizardGoal: (goal) => set((s) => ({ wizard: { ...s.wizard, goal } })),
  addWizardDay: (day) =>
    set((s) => ({ wizard: { ...s.wizard, workoutDays: [...s.wizard.workoutDays, day] } })),
  removeWizardDay: (id) =>
    set((s) => ({
      wizard: { ...s.wizard, workoutDays: s.wizard.workoutDays.filter((d) => d.id !== id) },
    })),
  reorderWizardDay: (id, direction) =>
    set((s) => {
      const days = [...s.wizard.workoutDays];
      const idx = days.findIndex((d) => d.id === id);
      if (idx < 0) return s;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= days.length) return s;
      [days[idx], days[newIdx]] = [days[newIdx], days[idx]];
      return { wizard: { ...s.wizard, workoutDays: days } };
    }),
  addExerciseToDay: (dayId, exercise) =>
    set((s) => ({
      wizard: {
        ...s.wizard,
        workoutDays: s.wizard.workoutDays.map((d) =>
          d.id === dayId ? { ...d, exercises: [...d.exercises, exercise] } : d,
        ),
      },
    })),
  removeExerciseFromDay: (dayId, exerciseIndex) =>
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
  finishWizard: () => {
    const { wizard, programs, editingProgramId } = get();
    const goal = wizard.goal;
    if (!wizard.name || !goal) return;

    if (editingProgramId) {
      set((s) => ({
        programs: s.programs.map((p) =>
          p.id === editingProgramId
            ? {
                ...p,
                name: wizard.name,
                description: wizard.description,
                goal,
                workoutDays: wizard.workoutDays,
              }
            : p,
        ),
        wizard: { ...INITIAL_WIZARD },
        editingProgramId: null,
      }));
    } else {
      const newProgram: ProgramData = {
        id: genId(),
        name: wizard.name,
        description: wizard.description,
        goal,
        scheduleType: 'rolling',
        isActive: programs.length === 0,
        workoutDays: wizard.workoutDays,
        createdAt: Date.now(),
      };
      set((s) => ({
        programs: [...s.programs, newProgram],
        wizard: { ...INITIAL_WIZARD },
        editingProgramId: null,
      }));
    }
  },
}));
