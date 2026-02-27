export interface MuscleGroup {
  id: string;
  name: string;
  shortName: string;
  defaultWeeklyTarget: number;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', shortName: 'CHEST', defaultWeeklyTarget: 16 },
  { id: 'back', name: 'Back', shortName: 'BACK', defaultWeeklyTarget: 18 },
  { id: 'shoulders', name: 'Shoulders', shortName: 'SHOULDERS', defaultWeeklyTarget: 14 },
  { id: 'biceps', name: 'Biceps', shortName: 'BICEPS', defaultWeeklyTarget: 12 },
  { id: 'triceps', name: 'Triceps', shortName: 'TRICEPS', defaultWeeklyTarget: 12 },
  { id: 'quads', name: 'Quads', shortName: 'QUADS', defaultWeeklyTarget: 16 },
  { id: 'hamstrings', name: 'Hamstrings', shortName: 'HAMSTRINGS', defaultWeeklyTarget: 14 },
  { id: 'glutes', name: 'Glutes', shortName: 'GLUTES', defaultWeeklyTarget: 12 },
  { id: 'calves', name: 'Calves', shortName: 'CALVES', defaultWeeklyTarget: 10 },
  { id: 'abs', name: 'Abs', shortName: 'ABS', defaultWeeklyTarget: 10 },
  { id: 'forearms', name: 'Forearms', shortName: 'FOREARMS', defaultWeeklyTarget: 8 },
  { id: 'traps', name: 'Traps', shortName: 'TRAPS', defaultWeeklyTarget: 10 },
];
