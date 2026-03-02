import { useEffect, useCallback, useRef } from 'react';
import { useWorkoutStore } from '@/stores/workout-store';
import { useHistoryStore } from '@/stores/history-store';
import type { WorkoutSummaryData, ActiveSet } from '@/stores/workout-store';

/**
 * Hook for managing workout session lifecycle
 * Abstracts complex store interactions for starting, updating, and completing workouts
 */
export function useWorkoutSession() {
  const workoutStore = useWorkoutStore();
  const historyStore = useHistoryStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current workout state from store
  const workout = workoutStore.workout;
  const isActive = workoutStore.status === 'active';
  const isPaused = workoutStore.status === 'paused';
  const isCompleted = workoutStore.status === 'completed';

  // Start a new workout
  const startWorkout = useCallback(
    (programId: string, workoutDayId: string, exercises: any[]) => {
      workoutStore.startWorkout(programId, workoutDayId, exercises);
    },
    [workoutStore]
  );

  // Pause the current workout
  const pauseWorkout = useCallback(() => {
    workoutStore.pauseWorkout();
  }, [workoutStore]);

  // Resume a paused workout
  const resumeWorkout = useCallback(() => {
    workoutStore.resumeWorkout();
  }, [workoutStore]);

  // Add a set to an exercise
  const addSet = useCallback(
    (exerciseId: string, set: Omit<ActiveSet, 'id'>) => {
      workoutStore.addSet(exerciseId, set);
    },
    [workoutStore]
  );

  // Update a set
  const updateSet = useCallback(
    (setId: string, updates: Partial<ActiveSet>) => {
      workoutStore.updateSet(setId, updates);
    },
    [workoutStore]
  );

  // Complete a set
  const completeSet = useCallback(
    (setId: string) => {
      workoutStore.completeSet(setId);
    },
    [workoutStore]
  );

  // Delete a set
  const deleteSet = useCallback(
    (setId: string) => {
      workoutStore.deleteSet(setId);
    },
    [workoutStore]
  );

  // Complete the workout and save to history
  const finishWorkout = useCallback(async (notes?: string) => {
    // Complete the workout in store
    workoutStore.completeWorkout(notes);

    // Build summary from current workout
    const summary: WorkoutSummaryData = {
      id: workoutStore.workout.id,
      programId: workoutStore.workout.programId,
      workoutDayId: workoutStore.workout.workoutDayId,
      name: workoutStore.workout.name || 'Workout',
      date: new Date().toISOString(),
      duration: workoutStore.workout.duration,
      totalSets: workoutStore.sets.length,
      completedSets: workoutStore.sets.filter((s) => s.isCompleted).length,
      totalVolume: workoutStore.sets.reduce(
        (sum, s) => sum + (s.isCompleted ? s.weight * s.reps : 0),
        0
      ),
      exercises: [], // Built from sets
      prs: [], // PR detection happens separately
    };

    // Add to history
    historyStore.addWorkout(summary);

    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [workoutStore, historyStore]);

  // Cancel the workout without saving
  const cancelWorkout = useCallback(() => {
    workoutStore.cancelWorkout();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [workoutStore]);

  // Start the workout timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      workoutStore.tick();
    }, 1000);
  }, [workoutStore]);

  // Stop the workout timer
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    workout,
    isActive,
    isPaused,
    isCompleted,
    exercises: workoutStore.exercises,
    sets: workoutStore.sets,
    duration: workoutStore.workout.duration,

    // Actions
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    addSet,
    updateSet,
    completeSet,
    deleteSet,
    finishWorkout,
    cancelWorkout,

    // Timer
    startTimer,
    stopTimer,
  };
}
