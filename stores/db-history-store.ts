import { create } from 'zustand';
import { workoutSessionService, setLogService } from '@/db/services/workout-service';
import type { WorkoutSummaryData, ActiveSet, ExerciseSummary, PRRecord } from './workout-store';

// Helper to convert DB WorkoutSession to WorkoutSummaryData
async function sessionToSummary(session: any): Promise<WorkoutSummaryData> {
  const setLogs = await setLogService.findBySession(session.id);

  // Group set logs by exercise
  const exerciseMap = new Map<string, any[]>();
  for (const setLog of setLogs) {
    const exerciseName = (setLog as any).exerciseName || 'Unknown';
    if (!exerciseMap.has(exerciseName)) {
      exerciseMap.set(exerciseName, []);
    }
    exerciseMap.get(exerciseName)!.push(setLog);
  }

  const exercises: ExerciseSummary[] = [];
  let totalVolume = 0;
  let totalSetsCompleted = 0;

  for (const [exerciseName, logs] of exerciseMap) {
    const completed = logs.filter((l) => (l as any).isCompleted);
    const rpeValues = completed.map((l) => (l as any).rpe).filter((v) => v != null);
    const exerciseVolume = completed.reduce(
      (sum, l) => sum + (l as any).weight * (l as any).reps,
      0,
    );
    const topWeight =
      completed.length > 0 ? Math.max(...completed.map((l) => (l as any).weight)) : 0;
    const topReps = completed.length > 0 ? Math.max(...completed.map((l) => (l as any).reps)) : 0;

    exercises.push({
      exerciseName,
      muscleGroups: logs[0] ? (logs[0] as any).muscleGroups || [] : [],
      equipment: logs[0] ? (logs[0] as any).equipment || '' : '',
      completedSets: completed.length,
      totalSets: logs.length,
      totalVolume: exerciseVolume,
      topWeight,
      topReps,
      avgRpe: rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null,
      sets: completed.map((l) => ({
        id: l.id,
        setNumber: (l as any).setNumber,
        setType: (l as any).setType as any,
        weight: (l as any).weight,
        reps: (l as any).reps,
        rpe: (l as any).rpe,
        muscleConnection: (l as any).muscleConnection,
        isCompleted: (l as any).isCompleted,
        parentSetId: (l as any).parentSetId,
        notes: (l as any).notes || '',
        ghostWeight: null,
        ghostReps: null,
      })),
    });

    totalVolume += exerciseVolume;
    totalSetsCompleted += completed.length;
  }

  const allCompleted = setLogs.filter((l) => (l as any).isCompleted);
  const allRpe = allCompleted.map((l) => (l as any).rpe).filter((v) => v != null);
  const avgRpe = allRpe.length > 0 ? allRpe.reduce((a, b) => a + b, 0) / allRpe.length : null;

  const durationSeconds =
    session.endTime && session.startTime
      ? Math.floor(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000,
        )
      : 0;

  return {
    workoutName: session.name,
    durationSeconds,
    totalVolume,
    totalSetsCompleted,
    totalSetsPlanned: setLogs.length,
    averageRpe: avgRpe,
    exercises,
    completedAt: session.endTime ? new Date(session.endTime).getTime() : Date.now(),
    prs: [], // Would need to calculate from PR service
  };
}

interface HistoryState {
  workouts: WorkoutSummaryData[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadHistory: (userId: string, limit?: number) => Promise<void>;
  loadDateRange: (userId: string, startDate: Date, endDate: Date) => Promise<void>;
  addWorkout: (workout: WorkoutSummaryData) => Promise<void>;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  workouts: [],
  isLoading: false,
  error: null,

  loadHistory: async (userId: string, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await workoutSessionService.findByUser(userId, limit);
      const workouts = await Promise.all(
        sessions.filter((s) => (s as any).status === 'completed').map((s) => sessionToSummary(s)),
      );
      // Sort by completedAt descending
      workouts.sort((a, b) => b.completedAt - a.completedAt);
      set({ workouts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load history',
        isLoading: false,
      });
    }
  },

  loadDateRange: async (userId: string, startDate: Date, endDate: Date) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await workoutSessionService.findByDateRange(userId, startDate, endDate);
      const workouts = await Promise.all(
        sessions.filter((s) => (s as any).status === 'completed').map((s) => sessionToSummary(s)),
      );
      workouts.sort((a, b) => b.completedAt - a.completedAt);
      set({ workouts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load history',
        isLoading: false,
      });
    }
  },

  addWorkout: async (workout: WorkoutSummaryData) => {
    // This would create a new session from the workout summary
    // For now, just add to local state
    set((s) => ({ workouts: [workout, ...s.workouts] }));
  },

  clear: () => set({ workouts: [] }),
}));
