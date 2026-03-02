import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';

export interface TechniqueEffectivenessResult {
  exerciseName: string;
  totalSessions: number;
  avgReps: number;
  avgWeight: number;
  avgRPE: number;
  repRange: string;
  effectiveness: 'excellent' | 'good' | 'needs_work' | 'unknown';
  recommendations: string[];
}

/**
 * Technique Effectiveness Algorithm
 * Analyzes RPE vs reps regression to determine if user is training in optimal rep ranges
 */

// Ideal rep ranges per goal
const REP_RANGES: Record<string, { min: number; max: number; goal: string }> = {
  hypertrophy: { min: 6, max: 12, goal: 'hypertrophy' },
  strength: { min: 1, max: 5, goal: 'strength' },
  endurance: { min: 15, max: 30, goal: 'endurance' },
  general: { min: 8, max: 15, goal: 'general' },
};

/**
 * Analyze technique effectiveness for a specific exercise
 */
export async function analyzeTechniqueEffectiveness(
  exerciseName: string,
  userGoal: string = 'general',
): Promise<TechniqueEffectivenessResult> {
  // Get all set logs for this exercise
  const setLogs = await database
    .get<SetLog>('set_logs')
    .query(Q.where('exercise_name', exerciseName), Q.where('is_completed', true))
    .fetch();

  if (setLogs.length < 5) {
    return {
      exerciseName,
      totalSessions: setLogs.length,
      avgReps: 0,
      avgWeight: 0,
      avgRPE: 0,
      repRange: 'unknown',
      effectiveness: 'unknown',
      recommendations: ['Keep training to gather more data for analysis'],
    };
  }

  // Calculate averages
  let totalReps = 0;
  let totalWeight = 0;
  let totalRPE = 0;
  let repsCount = 0;
  let weightCount = 0;
  let rpeCount = 0;

  for (const setLog of setLogs) {
    const reps = (setLog as any).reps;
    const weight = (setLog as any).weight;
    const rpe = (setLog as any).rpe;

    if (reps != null) {
      totalReps += reps;
      repsCount++;
    }
    if (weight != null && weight > 0) {
      totalWeight += weight;
      weightCount++;
    }
    if (rpe != null) {
      totalRPE += rpe;
      rpeCount++;
    }
  }

  const avgReps = repsCount > 0 ? Math.round(totalReps / repsCount) : 0;
  const avgWeight = weightCount > 0 ? Math.round(totalWeight / weightCount) : 0;
  const avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;

  // Determine rep range
  let repRange: string;
  if (avgReps <= 5) repRange = '1-5 (Strength)';
  else if (avgReps <= 12) repRange = '6-12 (Hypertrophy)';
  else if (avgReps <= 20) repRange = '13-20 (Endurance)';
  else repRange = '20+ (Endurance)';

  // Determine effectiveness
  const goalRange = REP_RANGES[userGoal] || REP_RANGES.general;
  let effectiveness: 'excellent' | 'good' | 'needs_work' | 'unknown';
  const recommendations: string[] = [];

  if (avgRPE === 0) {
    effectiveness = 'unknown';
    recommendations.push('Start tracking RPE to get effectiveness feedback');
  } else if (avgReps >= goalRange.min && avgReps <= goalRange.max) {
    // In optimal range
    if (avgRPE >= 7 && avgRPE <= 9) {
      effectiveness = 'excellent';
      recommendations.push(`You're training in the optimal ${goalRange.goal} range!`);
      if (avgRPE < 8) {
        recommendations.push('You could increase weight slightly for more growth stimulus');
      }
    } else if (avgRPE >= 9.5) {
      effectiveness = 'needs_work';
      recommendations.push('RPE is very high - consider reducing weight to maintain form');
      recommendations.push('Focus on controlled negatives and full range of motion');
    } else {
      effectiveness = 'good';
      recommendations.push(`Good training in ${goalRange.goal} range`);
      recommendations.push('Track RPE to optimize training zones');
    }
  } else {
    // Outside optimal range
    effectiveness = 'needs_work';
    if (avgReps < goalRange.min) {
      recommendations.push(
        `You're training below the ${goalRange.goal} rep range (${goalRange.min}-${goalRange.max})`,
      );
      recommendations.push('Consider reducing weight to get more reps in the optimal range');
    } else {
      recommendations.push(
        `You're training above the ${goalRange.goal} rep range (${goalRange.min}-${goalRange.max})`,
      );
      recommendations.push('Consider increasing weight to get into the optimal rep range');
    }
  }

  // Add RPE-specific recommendations
  if (avgRPE >= 10) {
    recommendations.push('⚠️ RPE 10 indicates max effort - ensure proper form to prevent injury');
  } else if (avgRPE <= 5 && avgRPE > 0) {
    recommendations.push('💡 Low RPE suggests you could push harder for better stimulus');
  }

  return {
    exerciseName,
    totalSessions: setLogs.length,
    avgReps,
    avgWeight,
    avgRPE,
    repRange,
    effectiveness,
    recommendations,
  };
}

/**
 * Get technique analysis for all exercises in a user's program
 */
export async function getAllTechniqueAnalysis(
  userId: string,
  userGoal: string = 'general',
): Promise<TechniqueEffectivenessResult[]> {
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

  const results: TechniqueEffectivenessResult[] = [];
  for (const exerciseName of exerciseNames) {
    const result = await analyzeTechniqueEffectiveness(exerciseName, userGoal);
    results.push(result);
  }

  return results;
}

/**
 * Get exercises that need attention (needs_work effectiveness)
 */
export function getExercisesNeedingWork(
  analysis: TechniqueEffectivenessResult[],
): TechniqueEffectivenessResult[] {
  return analysis.filter((a) => a.effectiveness === 'needs_work');
}

/**
 * Get top performing exercises (excellent effectiveness)
 */
export function getTopPerformingExercises(
  analysis: TechniqueEffectivenessResult[],
): TechniqueEffectivenessResult[] {
  return analysis.filter((a) => a.effectiveness === 'excellent');
}
