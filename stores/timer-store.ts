import { create } from 'zustand';
import { haptics } from '@/lib/haptics';

interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  selectedDuration: number;

  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  extend: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  tick: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  isPaused: false,
  totalSeconds: 90,
  remainingSeconds: 0,
  selectedDuration: 90,

  start: (seconds) =>
    set({
      isActive: true,
      isPaused: false,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      selectedDuration: seconds,
    }),

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  skip: () => {
    haptics.light();
    set({ isActive: false, isPaused: false, remainingSeconds: 0 });
  },

  extend: (seconds) =>
    set((s) => ({
      remainingSeconds: s.remainingSeconds + seconds,
      totalSeconds: s.totalSeconds + seconds,
    })),

  setDuration: (seconds) => {
    haptics.selection();
    set({
      totalSeconds: seconds,
      remainingSeconds: seconds,
      selectedDuration: seconds,
    });
  },

  tick: () => {
    const { remainingSeconds, isPaused, isActive } = get();
    if (!isActive || isPaused) return;

    const next = remainingSeconds - 1;

    if (next === 10) haptics.light();
    if (next === 5) haptics.medium();
    if (next <= 0) {
      haptics.heavy();
      set({ isActive: false, remainingSeconds: 0 });
      return;
    }

    set({ remainingSeconds: next });
  },

  reset: () => set({ isActive: false, isPaused: false, remainingSeconds: 0 }),
}));
