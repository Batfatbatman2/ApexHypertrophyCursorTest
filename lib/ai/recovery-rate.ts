import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';
import ReadinessSurvey from '@/db/models/ReadinessSurvey';

export interface RecoveryMetrics {
  averageRPE: number;
  readinessScore: number;
  daysSinceLastWorkout: number;
  workoutFrequency: number; // workouts per week
  suggestedRestDays: number;
  status: 'recovered' | 'fatigued' | 'overtrained';
}

/**
 * Recovery Rate Algorithm
 * Analyzes RPE trends and readiness surveys to recommend rest days
 */
export async function calculateRecoveryRate(
  userId: string,
  customRecoveryHours?: number,
): Promise<RecoveryMetrics> {
  const defaultRecoveryHours = customRecoveryHours || 48; // Default 48 hours between sessions

  // Get last 7 days of workout data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(
      Q.where('user_id', userId),
      Q.where('start_time', Q.gte(sevenDaysAgo.getTime())),
      Q.sortBy('start_time', Q.desc),
    )
    .fetch();

  // Calculate average RPE from completed sessions
  let totalRPE = 0;
  let rpeCount = 0;
  let completedSessions = 0;

  for (const session of sessions) {
    if ((session as any).status !== 'completed') continue;
    completedSessions++;

    const setLogs = await database
      .get<SetLog>('set_logs')
      .query(Q.where('workout_session_id', session.id), Q.where('is_completed', true))
      .fetch();

    for (const setLog of setLogs) {
      const rpe = (setLog as any).rpe;
      if (rpe != null) {
        totalRPE += rpe;
        rpeCount++;
      }
    }
  }

  const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;

  // Calculate workout frequency
  const workoutFrequency = completedSessions;

  // Get latest readiness survey
  const readinessSurveys = await database
    .get<ReadinessSurvey>('readiness_surveys')
    .query(Q.where('user_id', userId), Q.sortBy('surveyed_at', Q.desc), Q.take(1))
    .fetch();

  const latestReadiness = readinessSurveys[0];
  const readinessScore = latestReadiness ? (latestReadiness as any).score || 0 : 50; // Default to neutral

  // Calculate days since last workout
  let daysSinceLastWorkout = 0;
  if (sessions.length > 0) {
    const lastWorkout = sessions[0];
    const lastWorkoutTime = (lastWorkout as any).startTime?.getTime() || 0;
    daysSinceLastWorkout = Math.floor((Date.now() - lastWorkoutTime) / (1000 * 60 * 60 * 24));
  }

  // Determine status based on RPE and readiness
  let status: 'recovered' | 'fatigued' | 'overtrained';
  let suggestedRestDays = 0;

  if (averageRPE >= 9 || readinessScore < 30) {
    status = 'overtrained';
    suggestedRestDays = 2;
  } else if (averageRPE >= 8 || readinessScore < 50) {
    status = 'fatigued';
    suggestedRestDays = 1;
  } else {
    status = 'recovered';
    suggestedRestDays = 0;
  }

  // Adjust based on workout frequency
  if (workoutFrequency >= 6 && suggestedRestDays < 1) {
    suggestedRestDays = 1;
  }

  return {
    averageRPE: Math.round(averageRPE * 10) / 10,
    readinessScore,
    daysSinceLastWorkout,
    workoutFrequency,
    suggestedRestDays,
    status,
  };
}

/**
 * Get recommended actions based on recovery status
 */
export function getRecoveryRecommendations(metrics: RecoveryMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.status === 'overtrained') {
    recommendations.push('🔥 Take at least 2 rest days to recover fully');
    recommendations.push('💤 Prioritize sleep and nutrition');
    recommendations.push('🧘 Consider light mobility work instead of intense training');
  } else if (metrics.status === 'fatigued') {
    recommendations.push('😴 Consider taking 1 rest day');
    recommendations.push('💪 Focus on recovery: sleep, hydration, nutrition');
    recommendations.push('🏃 If training, keep intensity moderate (RPE 6-7)');
  } else {
    recommendations.push("✅ You're well recovered! Ready for high-intensity training");
    if (metrics.workoutFrequency < 4) {
      recommendations.push('📈 Consider increasing training frequency');
    }
  }

  return recommendations;
}

/**
 * Determine if user should train today based on recovery
 */
export function canTrainToday(metrics: RecoveryMetrics): {
  canTrain: boolean;
  reason: string;
} {
  if (metrics.status === 'overtrained') {
    return {
      canTrain: false,
      reason: "You're still recovering from intense training. Take a rest day.",
    };
  }

  if (metrics.status === 'fatigued') {
    return {
      canTrain: true,
      reason: "You're slightly fatigued. Consider a lighter workout or active recovery.",
    };
  }

  return {
    canTrain: true,
    reason: "You're well recovered and ready to train!",
  };
}
