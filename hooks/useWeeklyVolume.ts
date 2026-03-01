import { useMemo } from 'react';
import { useHistoryStore } from '@/stores/history-store';
import type { WorkoutSummaryData } from '@/stores/workout-store';

export interface MuscleGroupVolume {
  muscleGroup: string;
  sets: number;
  volume: number; // total weight
}

export interface WeeklyVolumeData {
  weekStart: Date;
  weekEnd: Date;
  totalSets: number;
  totalVolume: number;
  muscleGroups: MuscleGroupVolume[];
  workoutsCompleted: number;
}

/**
 * Hook for calculating weekly volume metrics
 * Aggregates workout data to show volume per muscle group
 */
export function useWeeklyVolume(weeksBack: number = 0) {
  const historyStore = useHistoryStore();

  // Calculate the date range for the requested week
  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek - weeksBack * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { weekStart: startOfWeek, weekEnd: endOfWeek };
  }, [weeksBack]);

  // Filter workouts for this week
  const weekWorkouts = useMemo(() => {
    return historyStore.workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });
  }, [historyStore.workouts, weekStart, weekEnd]);

  // Calculate volume data
  const weeklyVolume = useMemo((): WeeklyVolumeData => {
    const muscleGroups = new Map<string, MuscleGroupVolume>();

    let totalSets = 0;
    let totalVolume = 0;

    for (const workout of weekWorkouts) {
      totalSets += workout.totalSets;
      totalVolume += workout.totalVolume;

      // Aggregate by muscle group (from exercise data)
      if (workout.exercises) {
        for (const exercise of workout.exercises) {
          const muscleGroup = exercise.muscleGroup || 'Other';
          const existing = muscleGroups.get(muscleGroup) || {
            muscleGroup,
            sets: 0,
            volume: 0,
          };

          existing.sets += exercise.sets || 0;
          existing.volume += exercise.volume || 0;

          muscleGroups.set(muscleGroup, existing);
        }
      }
    }

    return {
      weekStart,
      weekEnd,
      totalSets,
      totalVolume,
      muscleGroups: Array.from(muscleGroups.values()).sort(
        (a, b) => b.sets - a.sets
      ),
      workoutsCompleted: weekWorkouts.length,
    };
  }, [weekWorkouts, weekStart, weekEnd]);

  // Get volume for a specific muscle group
  const getVolumeForMuscle = (muscleGroup: string): number => {
    const found = weeklyVolume.muscleGroups.find(
      (m) => m.muscleGroup.toLowerCase() === muscleGroup.toLowerCase()
    );
    return found?.sets || 0;
  };

  // Compare to previous week
  const previousWeekVolume = useMemo(() => {
    // This would require re-calculating for week-1
    // For now, return null (could be enhanced)
    return null;
  }, []);

  // Calculate week-over-week change
  const weekOverWeekChange = useMemo(() => {
    if (!previousWeekVolume) return null;
    const diff = weeklyVolume.totalSets - previousWeekVolume.totalSets;
    const percentChange = previousWeekVolume.totalSets > 0
      ? (diff / previousWeekVolume.totalSets) * 100
      : 0;
    return {
      absolute: diff,
      percent: percentChange,
    };
  }, [weeklyVolume, previousWeekVolume]);

  // Get all 12 major muscle groups with volume (including zeros)
  const allMuscleGroups = useMemo(() => {
    const majorGroups = [
      'Chest',
      'Back',
      'Shoulders',
      'Biceps',
      'Triceps',
      'Forearms',
      'Quadriceps',
      'Hamstrings',
      'Glutes',
      'Calves',
      'Core',
      'Other',
    ];

    return majorGroups.map((group) => ({
      muscleGroup: group,
      sets: getVolumeForMuscle(group),
      volume: 0, // Would need exercise-level data
    }));
  }, [getVolumeForMuscle]);

  return {
    // Data
    weeklyVolume,
    weekWorkouts,
    allMuscleGroups,

    // Computed
    weekOverWeekChange,
    previousWeekVolume,

    // Helpers
    getVolumeForMuscle,

    // Metadata
    weekStart,
    weekEnd,
    weeksBack,
  };
}

/**
 * Hook specifically for home screen stats
 * Returns simplified volume metrics
 */
export function useHomeVolume() {
  const { weeklyVolume, weekWorkouts } = useWeeklyVolume(0);

  // This week's stats
  const stats = useMemo(() => ({
    workoutsThisWeek: weekWorkouts.length,
    setsThisWeek: weeklyVolume.totalSets,
    volumeThisWeek: weeklyVolume.totalVolume,
    avgSetsPerWorkout: weekWorkouts.length > 0
      ? Math.round(weeklyVolume.totalSets / weekWorkouts.length)
      : 0,
  }), [weeklyVolume, weekWorkouts]);

  return stats;
}
