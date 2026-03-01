import { useEffect, useCallback, useRef } from 'react';
import { useTimerStore } from '@/stores/timer-store';
import { useSettingsStore } from '@/stores/settings-store';
import { formatTime, formatDuration, calculateRecommendedRest } from '@/lib/timer';

/**
 * Hook for managing rest timer between sets
 * Provides auto-start functionality and haptic feedback
 */
export function useRestTimer() {
  const timerStore = useTimerStore();
  const settingsStore = useSettingsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get settings
  const defaultDuration = settingsStore.settings.restTimerDuration || 90;
  const autoStart = settingsStore.settings.autoStartTimer;

  // Current timer state
  const isActive = timerStore.isActive;
  const isPaused = timerStore.isPaused;
  const remaining = timerStore.remainingSeconds;
  const total = timerStore.totalSeconds;

  // Formatted display
  const display = formatTime(remaining);
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  // Start timer with optional custom duration
  const start = useCallback(
    (seconds?: number) => {
      const duration = seconds ?? defaultDuration;
      timerStore.start(duration);

      // Auto-start the countdown if enabled
      if (autoStart && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          timerStore.tick();
        }, 1000);
      }
    },
    [timerStore, defaultDuration, autoStart]
  );

  // Start with recommended rest based on workout context
  const startWithRecommendation = useCallback(
    (setsCompleted: number, rpe: number | null, isCompound: boolean) => {
      const recommended = calculateRecommendedRest(setsCompleted, rpe, isCompound);
      start(recommended);
    },
    [start]
  );

  // Pause the timer
  const pause = useCallback(() => {
    timerStore.pause();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerStore]);

  // Resume the timer
  const resume = useCallback(() => {
    timerStore.resume();
    if (!intervalRef.current && isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        timerStore.tick();
      }, 1000);
    }
  }, [timerStore, isActive, isPaused]);

  // Skip/finish the timer
  const skip = useCallback(() => {
    timerStore.skip();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerStore]);

  // Extend timer by seconds
  const extend = useCallback(
    (seconds: number) => {
      timerStore.extend(seconds);
      // Restart interval if needed
      if (!intervalRef.current && isPaused) {
        resume();
      }
    },
    [timerStore, isPaused, resume]
  );

  // Set default duration
  const setDefaultDuration = useCallback(
    (seconds: number) => {
      timerStore.setDuration(seconds);
    },
    [timerStore]
  );

  // Reset timer
  const reset = useCallback(() => {
    timerStore.reset();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerStore]);

  // Handle timer completion
  useEffect(() => {
    if (remaining === 0 && isActive) {
      // Timer just finished - any cleanup needed?
    }
  }, [remaining, isActive]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isActive,
    isPaused,
    remaining,
    total,
    display,
    progress,
    defaultDuration,

    // Actions
    start,
    startWithRecommendation,
    pause,
    resume,
    skip,
    extend,
    setDefaultDuration,
    reset,
  };
}
