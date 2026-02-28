import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';
import PersonalRecord from '@/db/models/PersonalRecord';

export interface PlateauDetectionResult {
  exerciseName: string;
  isOnPlateau: boolean;
  plateauDuration: number; // weeks
  lastPRDate: number | null;
  weeksWithoutPR: number;
  progressRate: number; // weight gain per week
  recommendation: string;
  alternative?: string;
}

/**
 * Plateau Detection Algorithm
 * Uses regression analysis to detect when progress has stalled
 */

// Minimum weeks of data needed to detect plateau
const MIN_WEEKS = 4;
// Plateau threshold: if progress rate drops below this, consider it a plateau
const PLATEAU_THRESHOLD = 0.1; // lbs/kg per week

/**
 * Analyze if an exercise is on a plateau
 */
export async function analyzePlateau(
  exerciseName: string,
  minWeeks: number = MIN_WEEKS,
): Promise<PlateauDetectionResult> {
  // Get all PRs for this exercise
  const prs = await database
    .get<PersonalRecord>('personal_records')
    .query(
      Q.where('exercise_name', exerciseName),
      Q.where('pr_type', 'weight'),
      Q.sortBy('achieved_at', Q.desc),
    )
    .fetch();

  if (prs.length < 3) {
    return {
      exerciseName,
      isOnPlateau: false,
      plateauDuration: 0,
      lastPRDate: null,
      weeksWithoutPR: 0,
      progressRate: 0,
      recommendation: 'Not enough data to detect plateau. Keep training!',
    };
  }

  // Calculate weeks without PR
  const latestPR = prs[0];
  const lastPRTime = (latestPR as any).achievedAt?.getTime() || 0;
  const weeksWithoutPR = Math.floor((Date.now() - lastPRTime) / (7 * 24 * 60 * 60 * 1000));

  // Calculate progress rate using linear regression
  const prData: { weeksAgo: number; weight: number }[] = [];

  for (let i = 0; i < prs.length; i++) {
    const prTime = (prs[i] as any).achievedAt?.getTime() || 0;
    const weeksAgo = Math.floor((Date.now() - prTime) / (7 * 24 * 60 * 60 * 1000));
    const weight = (prs[i] as any).value || 0;

    if (weeksAgo > 0 && weight > 0) {
      prData.push({ weeksAgo, weight });
    }
  }

  // Sort by weeksAgo (most recent first)
  prData.sort((a, b) => a.weeksAgo - b.weeksAgo);

  if (prData.length < 2) {
    return {
      exerciseName,
      isOnPlateau: false,
      plateauDuration: 0,
      lastPRDate: lastPRTime,
      weeksWithoutPR,
      progressRate: 0,
      recommendation: 'Need more PR history to analyze progress rate.',
    };
  }

  // Calculate progress rate (simple linear regression)
  // slope = rate of weight change per week
  const n = prData.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (const point of prData) {
    sumX += point.weeksAgo;
    sumY += point.weight;
    sumXY += point.weeksAgo * point.weight;
    sumX2 += point.weeksAgo * point.weeksAgo;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;

  // Determine if on plateau
  const isOnPlateau = weeksWithoutPR >= minWeeks && Math.abs(slope) < PLATEAU_THRESHOLD;

  // Generate recommendation
  let recommendation: string;
  let alternative: string | undefined;

  if (isOnPlateau) {
    if (weeksWithoutPR >= 8) {
      recommendation = `🚨 ${weeksWithoutPR} weeks without progress! Major plateau detected.`;
      recommendation += ' Consider: deload, exercise rotation, or training variables change.';
    } else {
      recommendation = `⚠️ Possible plateau - ${weeksWithoutPR} weeks without new PR.`;
      recommendation += ' Try: increasing rest time, drop sets, or changing rep ranges.';
    }

    // Suggest alternatives if on plateau
    const alternatives: Record<string, string[]> = {
      'Barbell Bench Press': ['Incline Dumbbell Press', 'Machine Chest Press'],
      'Barbell Back Squat': ['Leg Press', 'Front Squat', 'Bulgarian Split Squat'],
      'Barbell Row': ['Pull-Ups', 'Dumbbell Row', 'Chest-Supported Row'],
      Deadlift: ['Romanian Deadlift', 'Trap Bar Deadlift', 'Cable Pull-Through'],
      'Overhead Press': ['Push Press', 'Dumbbell Shoulder Press', 'Machine Press'],
    };

    alternatives[exerciseName] && (alternative = alternatives[exerciseName][0]);
  } else if (slope > PLATEAU_THRESHOLD) {
    recommendation = `📈 Great progress! You're gaining ~${Math.abs(slope).toFixed(1)} lbs/week. Keep it up!`;
  } else {
    recommendation = '✅ Making steady progress. Keep training consistently.';
  }

  return {
    exerciseName,
    isOnPlateau,
    plateauDuration: isOnPlateau ? weeksWithoutPR : 0,
    lastPRDate: lastPRTime,
    weeksWithoutPR,
    progressRate: Math.round(slope * 10) / 10,
    recommendation,
    alternative,
  };
}

/**
 * Get all exercises that are on plateau
 */
export async function getPlateauExercises(userId: string): Promise<PlateauDetectionResult[]> {
  // Get all exercises the user has trained
  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(Q.where('user_id', userId), Q.where('status', 'completed'))
    .fetch();

  const exerciseNames = new Set<string>();
  for (const session of sessions) {
    const setLogs = await database
      .get<SetLog>('set_logs')
      .query(Q.where('workout_session_id', session.id), Q.where('is_completed', true))
      .fetch();

    for (const setLog of setLogs) {
      exerciseNames.add((setLog as any).exerciseName);
    }
  }

  const results: PlateauDetectionResult[] = [];
  for (const exerciseName of exerciseNames) {
    const result = await analyzePlateau(exerciseName);
    results.push(result);
  }

  // Sort by plateau duration (worst first)
  results.sort((a, b) => b.weeksWithoutPR - a.weeksWithoutPR);

  return results;
}

/**
 * Get actionable recommendations for all plateaued exercises
 */
export function getPlateauRecommendations(results: PlateauDetectionResult[]): {
  critical: string[];
  warnings: string[];
  tips: string[];
} {
  const critical: string[] = [];
  const warnings: string[] = [];
  const tips: string[] = [];

  for (const result of results) {
    if (result.isOnPlateau && result.weeksWithoutPR >= 8) {
      critical.push(`${result.exerciseName}: ${result.recommendation}`);
    } else if (result.isOnPlateau) {
      warnings.push(`${result.exerciseName}: ${result.recommendation}`);
    }

    if (result.alternative) {
      tips.push(`Try ${result.alternative} instead of ${result.exerciseName}`);
    }
  }

  return { critical, warnings, tips };
}
