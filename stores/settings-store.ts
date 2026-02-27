import { create } from 'zustand';

export type WeightUnit = 'lbs' | 'kg';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  weightUnit: WeightUnit;
  defaultRestDuration: number;
  autoStartTimer: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemeMode;

  setWeightUnit: (unit: WeightUnit) => void;
  setDefaultRestDuration: (seconds: number) => void;
  setAutoStartTimer: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  weightUnit: 'lbs',
  defaultRestDuration: 90,
  autoStartTimer: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  theme: 'dark',

  setWeightUnit: (unit) => set({ weightUnit: unit }),
  setDefaultRestDuration: (seconds) => set({ defaultRestDuration: seconds }),
  setAutoStartTimer: (enabled) => set({ autoStartTimer: enabled }),
  setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setTheme: (theme) => set({ theme }),
}));
