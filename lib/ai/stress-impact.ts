import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import WorkoutSession from '@/db/models/WorkoutSession';
import ReadinessSurvey from '@/db/models/ReadinessSurvey';

export interface StressImpactResult {
  stressScore: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'extreme';
  readinessAdjusted: number;
  weeklyWorkoutCount: number;
  weeklyVolume: number;
  recommendation: string;
}

/**
 * Stress Impact Algorithm
 * Uses readiness survey multiplier to adjust training recommendations
 */

/**
 * Calculate stress impact based on readiness and training load
 */
export async function calculateStressImpact(userId: string): Promise<StressImpactResult> {
  // Get readiness surveys from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const readinessSurveys = await database
    .get<ReadinessSurvey>('readiness_surveys')
    .query(Q.where('user_id', userId), Q.where('surveyed_at', Q.gte(sevenDaysAgo.getTime())))
    .fetch();

  // Calculate average readiness score
  let totalScore = 0;
  let surveyCount = 0;

  for (const survey of readinessSurveys) {
    const score = (survey as any).score;
    if (score != null) {
      totalScore += score;
      surveyCount++;
    }
  }

  const avgReadiness = surveyCount > 0 ? totalScore / surveyCount : 50; // Default to neutral

  // Get weekly workout count
  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(
      Q.where('user_id', userId),
      Q.where('start_time', Q.gte(sevenDaysAgo.getTime())),
      Q.where('status', 'completed'),
    )
    .fetch();

  const weeklyWorkoutCount = sessions.length;

  // Estimate weekly volume (simplified - actual would sum set logs)
  // Assuming average 15 sets per workout
  const weeklyVolume = weeklyWorkoutCount * 15;

  // Calculate stress score components
  // Low readiness = high stress
  const readinessStress = 100 - avgReadiness;

  // Frequency stress
  let frequencyStress = 0;
  if (weeklyWorkoutCount >= 6) frequencyStress = 40;
  else if (weeklyWorkoutCount >= 4) frequencyStress = 20;
  else if (weeklyWorkoutCount >= 3) frequencyStress = 0;
  else frequencyStress = 10; // Too little training also adds stress

  // Volume stress
  let volumeStress = 0;
  if (weeklyVolume >= 100) volumeStress = 30;
  else if (weeklyVolume >= 60) volumeStress = 15;
  else volumeStress = 0;

  // Calculate total stress score
  const stressScore = Math.min(
    Math.round(readinessStress * 0.4 + frequencyStress * 0.3 + volumeStress * 0.3),
    100,
  );

  // Determine stress level
  let level: 'low' | 'moderate' | 'high' | 'extreme';
  if (stressScore < 25) level = 'low';
  else if (stressScore < 50) level = 'moderate';
  else if (stressScore < 75) level = 'high';
  else level = 'extreme';

  // Calculate readiness-adjusted training capacity
  const readinessAdjusted = Math.round((avgReadiness / 100) * 100);

  // Generate recommendation
  let recommendation: string;
  if (stressScore >= 75) {
    recommendation = '🛑 Very high stress! Take 2+ rest days. Focus on sleep and nutrition.';
  } else if (stressScore >= 50) {
    recommendation = '⚠️ Moderate stress. Consider a deload week or lighter training.';
  } else if (stressScore >= 25) {
    recommendation = '✅ Stress levels are manageable. Continue with current training.';
  } else {
    recommendation = '🚀 Low stress! Great time to push intensity or increase volume.';
  }

  return {
    stressScore,
    level,
    readinessAdjusted,
    weeklyWorkoutCount,
    weeklyVolume,
    recommendation,
  };
}

/**
 * Get recommended training modifications based on stress level
 */
export function getStressBasedModifications(result: StressImpactResult): {
  intensity: 'reduce' | 'maintain' | 'increase';
  volume: 'reduce' | 'maintain' | 'increase';
  frequency: 'reduce' | 'maintain' | 'increase';
  specificAdvice: string[];
} {
  const specificAdvice: string[] = [];

  let intensity: 'reduce' | 'maintain' | 'increase';
  let volume: 'reduce' | 'maintain' | 'increase';
  let frequency: 'reduce' | 'maintain' | 'increase';

  if (result.level === 'extreme') {
    intensity = 'reduce';
    volume = 'reduce';
    frequency = 'reduce';
    specificAdvice.push('Take complete rest for 2-3 days');
    specificAdvice.push('Focus on sleep (7-9 hours)');
    specificAdvice.push('Reduce training to 50% volume when returning');
  } else if (result.level === 'high') {
    intensity = 'reduce';
    volume = 'maintain';
    frequency = 'reduce';
    specificAdvice.push('Reduce workout intensity by 10-20%');
    specificAdvice.push('Consider taking an extra rest day this week');
    specificAdvice.push('Prioritize recovery: mobility, stretching, sleep');
  } else if (result.level === 'moderate') {
    intensity = 'maintain';
    volume = 'maintain';
    frequency = 'maintain';
    specificAdvice.push('Current training is sustainable');
    specificAdvice.push('Monitor energy levels closely');
    specificAdvice.push('Focus on nutrition and hydration');
  } else {
    // Low stress
    intensity = 'increase';
    volume = 'increase';
    frequency = 'maintain';
    specificAdvice.push('Great time to increase training load!');
    specificAdvice.push('Consider adding 1-2 sets per muscle group');
    specificAdvice.push("You're ready for high-intensity sessions");
  }

  return {
    intensity,
    volume,
    frequency,
    specificAdvice,
  };
}

/**
 * Calculate stress-adjusted working weight
 */
export function calculateStressAdjustedWeight(
  baseWeight: number,
  stressResult: StressImpactResult,
): number {
  // Reduce working weight based on stress level
  let reduction = 0;

  switch (stressResult.level) {
    case 'extreme':
      reduction = 0.3; // 30% reduction
      break;
    case 'high':
      reduction = 0.2; // 20% reduction
      break;
    case 'moderate':
      reduction = 0.1; // 10% reduction
      break;
    case 'low':
    default:
      reduction = 0; // No reduction
  }

  return Math.round(baseWeight * (1 - reduction));
}
