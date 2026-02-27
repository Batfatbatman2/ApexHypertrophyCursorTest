import { create } from 'zustand';

export type TrainingAge = 'beginner' | 'intermediate' | 'advanced';
export type TrainingGoal = 'hypertrophy' | 'strength' | 'endurance' | 'general';
export type EquipmentAccess = 'full_gym' | 'home_gym' | 'bodyweight';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface OnboardingData {
  trainingAge: TrainingAge | null;
  goal: TrainingGoal | null;
  equipment: EquipmentAccess | null;
  age: number | null;
  gender: Gender | null;
  bodyweight: number | null;
  weightUnit: 'lbs' | 'kg';
  trainingDaysPerWeek: number;
  injuries: string[];
}

interface OnboardingState extends OnboardingData {
  currentStep: number;
  totalSteps: number;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTrainingAge: (age: TrainingAge) => void;
  setGoal: (goal: TrainingGoal) => void;
  setEquipment: (equipment: EquipmentAccess) => void;
  setAge: (age: number) => void;
  setGender: (gender: Gender) => void;
  setBodyweight: (weight: number) => void;
  setWeightUnit: (unit: 'lbs' | 'kg') => void;
  setTrainingDaysPerWeek: (days: number) => void;
  toggleInjury: (injury: string) => void;
  reset: () => void;
  getData: () => OnboardingData;
}

const INITIAL_DATA: OnboardingData = {
  trainingAge: null,
  goal: null,
  equipment: null,
  age: null,
  gender: null,
  bodyweight: null,
  weightUnit: 'lbs',
  trainingDaysPerWeek: 4,
  injuries: [],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...INITIAL_DATA,
  currentStep: 0,
  totalSteps: 8,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps - 1) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
  setTrainingAge: (trainingAge) => set({ trainingAge }),
  setGoal: (goal) => set({ goal }),
  setEquipment: (equipment) => set({ equipment }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setBodyweight: (bodyweight) => set({ bodyweight }),
  setWeightUnit: (weightUnit) => set({ weightUnit }),
  setTrainingDaysPerWeek: (trainingDaysPerWeek) => set({ trainingDaysPerWeek }),
  toggleInjury: (injury) =>
    set((s) => ({
      injuries: s.injuries.includes(injury)
        ? s.injuries.filter((i) => i !== injury)
        : [...s.injuries, injury],
    })),
  reset: () => set({ ...INITIAL_DATA, currentStep: 0 }),
  getData: () => {
    const s = get();
    return {
      trainingAge: s.trainingAge,
      goal: s.goal,
      equipment: s.equipment,
      age: s.age,
      gender: s.gender,
      bodyweight: s.bodyweight,
      weightUnit: s.weightUnit,
      trainingDaysPerWeek: s.trainingDaysPerWeek,
      injuries: s.injuries,
    };
  },
}));
