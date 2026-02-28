import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';

export type ExerciseStatus = 'proven' | 'experimental' | 'blacklisted';

export interface ExerciseCompatibilityResult {
  exerciseId: string;
  exerciseName: string;
  status: ExerciseStatus;
  timesPerformed: number;
  painCount: number;
  painRate: number;
  avgRPE: number;
  confidence: number;
  reasoning: string;
}

/**
 * Exercise Compatibility Algorithm
 * Tracks pain and performance per exercise to determine if it should be blacklisted
 */

// Pain threshold - if pain rate exceeds this, exercise is blacklisted
const PAIN_THRESHOLD = 30; // 30%
// Minimum data points needed before making a recommendation
const MIN_DATA_POINTS = 5;

/**
 * Analyze exercise compatibility based on user's history
 */
export async function analyzeExerciseCompatibility(
  userId: string,
  exerciseId: string,
  exerciseName: string,
): Promise<ExerciseCompatibilityResult> {
  // Get all set logs for this exercise
  const setLogs = await database
    .get<SetLog>('set_logs')
    .query(Q.where('exercise_name', exerciseName))
    .fetch();

  // Filter to completed sets only
  const completedSets = setLogs.filter((s) => (s as any).isCompleted);

  if (completedSets.length < MIN_DATA_POINTS) {
    return {
      exerciseId,
      exerciseName,
      status: 'experimental',
      timesPerformed: completedSets.length,
      painCount: 0,
      painRate: 0,
      avgRPE: 0,
      confidence: Math.min(completedSets.length * 20, 80), // Max 80% confidence
      reasoning: `Not enough data yet. You've only performed this exercise ${completedSets.length} times.`,
    };
  }

  // Count sets with pain indicators
  // Pain is inferred from: low reps (struggling), very high RPE (>9)
  let painCount = 0;
  let totalRPE = 0;
  let rpeCount = 0;

  for (const setLog of completedSets) {
    const rpe = (setLog as any).rpe;
    const reps = (setLog as any).reps;
    const notes = (setLog as any).notes || '';

    // Consider it "painful" if:
    // 1. Notes contain pain-related keywords
    // 2. Very low reps with high weight (potential injury)
    // 3. RPE > 9 consistently
    const hasPainNotes = /pain|injury|hurt|strain|discomfort/i.test(notes);
    const isHighRPE = rpe != null && rpe >= 9.5;
    const isLowReps = reps <= 3;

    if (hasPainNotes || (isHighRPE && isLowReps)) {
      painCount++;
    }

    if (rpe != null) {
      totalRPE += rpe;
      rpeCount++;
    }
  }

  const painRate = Math.round((painCount / completedSets.length) * 100);
  const avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;

  // Determine status
  let status: ExerciseStatus;
  let reasoning: string;

  if (painRate >= PAIN_THRESHOLD) {
    status = 'blacklisted';
    reasoning = `High pain rate (${painRate}%). Consider replacing with an alternative exercise.`;
  } else if (painRate >= 15) {
    status = 'experimental';
    reasoning = `Moderate discomfort reported (${painRate}%). Monitor closely and consider alternatives.`;
  } else if (avgRPE >= 7 && avgRPE <= 9) {
    status = 'proven';
    reasoning = `Good performance (avg RPE ${avgRPE}) with low pain. Keep it in your routine!`;
  } else if (avgRPE > 9) {
    status = 'experimental';
    reasoning = `High effort (avg RPE ${avgRPE}). Ensure proper form and consider deload.`;
  } else {
    status = 'proven';
    reasoning = `Proven exercise with ${completedSets.length} successful sessions.`;
  }

  // Calculate confidence based on data points
  const confidence = Math.min(60 + completedSets.length * 4, 100);

  return {
    exerciseId,
    exerciseName,
    status,
    timesPerformed: completedSets.length,
    painCount,
    painRate,
    avgRPE,
    confidence,
    reasoning,
  };
}

/**
 * Get all blacklisted exercises for a user
 */
export async function getBlacklistedExercises(userId: string): Promise<string[]> {
  // This would query the exercise_compatibility table
  // For now, we analyze all exercises used by the user
  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(Q.where('user_id', userId))
    .fetch();

  const exerciseNames = new Set<string>();
  for (const session of sessions) {
    const setLogs = await database
      .get<SetLog>('set_logs')
      .query(Q.where('workout_session_id', session.id))
      .fetch();

    for (const setLog of setLogs) {
      exerciseNames.add((setLog as any).exerciseName);
    }
  }

  const blacklisted: string[] = [];
  for (const exerciseName of exerciseNames) {
    const result = await analyzeExerciseCompatibility(userId, '', exerciseName);
    if (result.status === 'blacklisted') {
      blacklisted.push(exerciseName);
    }
  }

  return blacklisted;
}

/**
 * Get alternative exercises for a blacklisted one
 */
export function getAlternativeExercises(
  blacklistedExercise: string,
  availableExercises: string[],
): string[] {
  // Simple mapping of common alternatives
  const alternatives: Record<string, string[]> = {
    'Barbell Bench Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Push-Ups'],
    'Barbell Back Squat': ['Leg Press', 'Goblet Squat', 'Bulgarian Split Squat'],
    'Barbell Row': ['Dumbbell Row', 'Cable Row', 'Chest-Supported Row'],
    'Overhead Press': ['Dumbbell Shoulder Press', 'Machine Shoulder Press'],
    Deadlift: ['Romanian Deadlift', 'Trap Bar Deadlift', 'Leg Curl'],
  };

  const knownAlternatives = alternatives[blacklistedExercise] || [];
  return knownAlternatives.filter((alt) => availableExercises.includes(alt));
}
