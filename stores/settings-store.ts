import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { appStorage } from '@/lib/storage';

export type WeightUnit = 'lbs' | 'kg';
export type ThemeMode = 'system' | 'light' | 'dark';

function buildDefaultTargets(): Record<string, number> {
  const targets: Record<string, number> = {};
  for (const mg of MUSCLE_GROUPS) {
    targets[mg.id] = mg.defaultWeeklyTarget;
  }
  return targets;
}

interface SettingsState {
  weightUnit: WeightUnit;
  defaultRestDuration: number;
  autoStartTimer: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemeMode;
  volumeTargets: Record<string, number>;

  setWeightUnit: (unit: WeightUnit) => void;
  setDefaultRestDuration: (seconds: number) => void;
  setAutoStartTimer: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setVolumeTarget: (muscleId: string, sets: number) => void;
  resetVolumeTargets: () => void;
  resetAllSettings: () => void;
}

// Custom storage adapter for Zustand persist using MMKV
const zustandStorage = {
  getItem: (name: string): string | null => {
    const value = appStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    appStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    appStorage.delete(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: 'lbs',
      defaultRestDuration: 90,
      autoStartTimer: true,
      hapticsEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
      volumeTargets: buildDefaultTargets(),

      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setDefaultRestDuration: (seconds) => set({ defaultRestDuration: seconds }),
      setAutoStartTimer: (enabled) => set({ autoStartTimer: enabled }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setVolumeTarget: (muscleId, sets) =>
        set((s) => ({
          volumeTargets: { ...s.volumeTargets, [muscleId]: Math.max(0, Math.min(30, sets)) },
        })),
      resetVolumeTargets: () => set({ volumeTargets: buildDefaultTargets() }),
      resetAllSettings: () =>
        set({
          weightUnit: 'lbs',
          defaultRestDuration: 90,
          autoStartTimer: true,
          hapticsEnabled: true,
          notificationsEnabled: true,
          theme: 'dark',
          volumeTargets: buildDefaultTargets(),
        }),
    }),
    {
      name: 'apex-settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
