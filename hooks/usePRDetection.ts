import { useCallback, useEffect, useState } from 'react';
import { usePRStore } from '@/stores/pr-store';
import { useHistoryStore } from '@/stores/history-store';
import type { PRRecord, WorkoutSummaryData } from '@/stores/workout-store';

/**
 * Hook for detecting and managing personal records
 * Monitors completed sets and checks for new PRs
 */
export function usePRDetection() {
  const prStore = usePRStore();
  const historyStore = useHistoryStore();
  const [lastDetectedPR, setLastDetectedPR] = useState<PRRecord | null>(null);

  // Current PRs from store
  const prs = prStore.prs;
  const totalPRs = prStore.totalPRs;

  // Get PRs for a specific exercise
  const getPRsForExercise = useCallback(
    (exerciseId: string): PRRecord[] => {
      return prStore.getPRsForExercise(exerciseId);
    },
    [prStore]
  );

  // Check if a weight/rep combination is a PR
  const checkPR = useCallback(
    (exerciseId: string, weight: number, reps: number): PRRecord | null => {
      return prStore.checkPR(exerciseId, weight, reps);
    },
    [prStore]
  );

  // Record a completed set and check for PRs
  const recordSet = useCallback(
    (exerciseId: string, exerciseName: string, weight: number, reps: number): PRRecord | null => {
      const pr = prStore.recordSet(exerciseId, exerciseName, weight, reps);
      if (pr) {
        setLastDetectedPR(pr);
      }
      return pr;
    },
    [prStore]
  );

  // Clear the last detected PR (after showing celebration)
  const clearLastPR = useCallback(() => {
    setLastDetectedPR(null);
  }, []);

  // Build PRs from workout history
  const buildFromHistory = useCallback(
    (workouts: WorkoutSummaryData[]) => {
      prStore.buildFromHistory(workouts);
    },
    [prStore]
  );

  // Get all PRs sorted by date
  const getRecentPRs = useCallback(
    (limit: number = 10): PRRecord[] => {
      return prStore.recentPRs.slice(0, limit);
    },
    [prStore]
  );

  // Get PR count by type
  const getPRCountByType = useCallback(() => {
    return {
      weight: prStore.prs.filter((pr) => pr.prType === 'weight').length,
      reps: prStore.prs.filter((pr) => pr.prType === 'reps').length,
      volume: prStore.prs.filter((pr) => pr.prType === 'volume').length,
    };
  }, [prStore]);

  // Build PRs from history when it changes
  useEffect(() => {
    if (historyStore.workouts.length > 0) {
      buildFromHistory(historyStore.workouts);
    }
  }, [historyStore.workouts, buildFromHistory]);

  return {
    // State
    prs,
    totalPRs,
    lastDetectedPR,

    // Actions
    checkPR,
    recordSet,
    clearLastPR,
    buildFromHistory,

    // Queries
    getPRsForExercise,
    getRecentPRs,
    getPRCountByType,
  };
}
