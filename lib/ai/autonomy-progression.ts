import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';

export type AutonomyLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface AutonomyProgressionResult {
  currentLevel: AutonomyLevel;
  weeklyVolume: number;
  consistencyScore: number; // 0-100
  progressionScore: number; // 0-100
  readinessScore: number; // 0-100
  autonomyScore: number; // 0-100
  recommendation: string;
  nextLevel: AutonomyLevel | null;
  weeksToNextLevel: number;
}

/**
 * Autonomy Progression Algorithm
 * Tracks training consistency, progression, and readiness to recommend autonomy level
 */

// Volume thresholds for each level (sets per week)
const VOLUME_THRESHOLDS: Record<AutonomyLevel, number> = {
  beginner: 20,
  intermediate: 40,
  advanced: 60,
  elite: 80,
};

// Progression thresholds (weight gain per month, simplified)
const PROGRESSION_THRESHOLDS: Record<AutonomyLevel, number> = {
  beginner: 5, // 5% weight gain per month = advanced
  intermediate: 3,
  advanced: 1.5,
  elite: 0.5, // Very small gains
};

// Consistency thresholds (workouts per week)
const CONSISTENCY_THRESHOLDS: Record<AutonomyLevel, number> = {
  beginner: 2,
  intermediate: 3,
  advanced: 4,
  elite: 5,
};

/**
 * Analyze user's autonomy level based on training metrics
 */
export async function analyzeAutonomyLevel(userId: string): Promise<AutonomyProgressionResult> {
  // Get last 4 weeks of data
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Get sessions
  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(
      Q.where('user_id', userId),
      Q.where('start_time', Q.gte(fourWeeksAgo.getTime())),
      Q.where('status', 'completed'),
    )
    .fetch();

  // Calculate weekly volume (total sets)
  let totalSets = 0;
  for (const session of sessions) {
    const setLogs = await database
      .get<SetLog>('set_logs')
      .query(Q.where('workout_session_id', session.id), Q.where('is_completed', true))
      .fetch();
    totalSets += setLogs.length;
  }

  const weeksWithData = Math.max(
    1,
    Math.floor((Date.now() - fourWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)),
  );
  const weeklyVolume = Math.round(totalSets / weeksWithData);

  // Calculate consistency (workouts per week average)
  const workoutFrequency = Math.round((sessions.length / weeksWithData) * 10) / 10;

  // Calculate consistency score (0-100)
  const maxConsistency = 5; // Elite: 5+ workouts/week
  const consistencyScore = Math.min(100, Math.round((workoutFrequency / maxConsistency) * 100));

  // Calculate progression score (simplified - would use PR data in real implementation)
  // For now, use workout completion rate
  const progressionScore = Math.min(
    100,
    Math.round((weeklyVolume / VOLUME_THRESHOLDS.advanced) * 100),
  );

  // Readiness score (would integrate with readiness surveys)
  const readinessScore = 75; // Placeholder - would calculate from surveys

  // Calculate autonomy score (weighted average)
  const autonomyScore = Math.round(
    consistencyScore * 0.3 + progressionScore * 0.4 + readinessScore * 0.3,
  );

  // Determine current level
  let currentLevel: AutonomyLevel;
  if (autonomyScore < 25) currentLevel = 'beginner';
  else if (autonomyScore < 50) currentLevel = 'intermediate';
  else if (autonomyScore < 75) currentLevel = 'advanced';
  else currentLevel = 'elite';

  // Determine next level and weeks to reach
  const levels: AutonomyLevel[] = ['beginner', 'intermediate', 'advanced', 'elite'];
  const currentIndex = levels.indexOf(currentLevel);
  let nextLevel: AutonomyLevel | null = null;
  let weeksToNextLevel = 0;

  if (currentIndex < levels.length - 1) {
    nextLevel = levels[currentIndex + 1];
    // Calculate approximate weeks based on progression rate
    const scoreDiff = (currentIndex + 1) * 25 - autonomyScore;
    weeksToNextLevel = Math.max(1, Math.ceil(scoreDiff / 2));
  }

  // Generate recommendation
  let recommendation: string;

  switch (currentLevel) {
    case 'beginner':
      recommendation =
        '🎯 Focus on learning proper form and building consistency. Start with 2-3 workouts/week.';
      break;
    case 'intermediate':
      recommendation =
        '💪 Good foundation! Work on progressive overload and slightly increasing volume.';
      break;
    case 'advanced':
      recommendation =
        '🔥 Strong progress! Fine-tune your training variables and focus on recovery.';
      break;
    case 'elite':
      recommendation = '🏆 Elite-level training! Prioritize recovery, sleep, and periodization.';
      break;
    default:
      recommendation = 'Keep training consistently to progress!';
  }

  return {
    currentLevel,
    weeklyVolume,
    consistencyScore,
    progressionScore,
    readinessScore,
    autonomyScore,
    recommendation,
    nextLevel,
    weeksToNextLevel,
  };
}

/**
 * Get autonomy-based training recommendations
 */
export function getAutonomyRecommendations(result: AutonomyProgressionResult): string[] {
  const recommendations: string[] = [];

  // Volume recommendations
  const targetVolume = VOLUME_THRESHOLDS[result.currentLevel];
  if (result.weeklyVolume < targetVolume * 0.8) {
    recommendations.push(
      `📊 Increase weekly volume - you're at ${result.weeklyVolume} sets, target is ${targetVolume}+`,
    );
  } else if (result.weeklyVolume >= targetVolume) {
    recommendations.push(`✅ Volume is optimal at ${result.weeklyVolume} sets/week`);
  }

  // Consistency recommendations
  if (result.consistencyScore < 60) {
    recommendations.push('🎯 Focus on consistency - aim for more regular workouts');
  }

  // Progression recommendations
  if (result.progressionScore < 50) {
    recommendations.push('📈 Implement progressive overload - gradually increase weights');
  }

  // Level-specific recommendations
  if (result.currentLevel === 'beginner') {
    recommendations.push('🧘 Prioritize sleep and nutrition over high volume');
  } else if (result.currentLevel === 'intermediate') {
    recommendations.push('💪 Add 1-2 sets per muscle group when you plateau');
  } else if (result.currentLevel === 'advanced') {
    recommendations.push('🔄 Consider undulating periodization for continued gains');
  } else {
    recommendations.push('🎯 Focus on recovery and small incremental improvements');
  }

  return recommendations;
}

/**
 * Get weekly volume recommendation based on autonomy level
 */
export function getRecommendedVolume(level: AutonomyLevel): {
  min: number;
  max: number;
  description: string;
} {
  switch (level) {
    case 'beginner':
      return { min: 15, max: 25, description: 'Focus on learning, 2-3 days/week' };
    case 'intermediate':
      return { min: 25, max: 45, description: 'Build mass, 3-4 days/week' };
    case 'advanced':
      return { min: 45, max: 65, description: 'Maximize gains, 4-5 days/week' };
    case 'elite':
      return { min: 60, max: 80, description: 'Maintain peak, 5-6 days/week' };
  }
}
