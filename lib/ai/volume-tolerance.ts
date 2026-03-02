import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import SetLog from '@/db/models/SetLog';
import WorkoutSession from '@/db/models/WorkoutSession';

export interface VolumeMetrics {
  muscleGroup: string;
  weeklySets: number;
  mev: number; // Minimum Effective Volume
  mrv: number; // Maximum Recoverable Volume
  status: 'under' | 'optimal' | 'over' | 'maxed';
}

/**
 * Volume Tolerance Algorithm
 * Tracks MEV/MRV per muscle from set logs and returns volume status
 */
export async function calculateVolumeTolerance(
  userId: string,
  muscleGroups: string[],
  customMEV?: Record<string, number>,
  customMRV?: Record<string, number>,
): Promise<VolumeMetrics[]> {
  // Default targets (can be customized per user via AI profile)
  const defaultMEV: Record<string, number> = customMEV || {
    chest: 10,
    back: 12,
    shoulders: 10,
    biceps: 8,
    triceps: 8,
    quads: 10,
    hamstrings: 10,
    glutes: 8,
    calves: 6,
    abs: 6,
    forearms: 4,
    traps: 6,
  };

  const defaultMRV: Record<string, number> = customMRV || {
    chest: 20,
    back: 24,
    shoulders: 20,
    biceps: 16,
    triceps: 16,
    quads: 20,
    hamstrings: 20,
    glutes: 16,
    calves: 12,
    abs: 12,
    forearms: 8,
    traps: 12,
  };

  // Get last 7 days of workout data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sessions = await database
    .get<WorkoutSession>('workout_sessions')
    .query(Q.where('user_id', userId), Q.where('start_time', Q.gte(sevenDaysAgo.getTime())))
    .fetch();

  // Calculate sets per muscle group
  const setsPerMuscle: Record<string, number> = {};
  for (const mg of muscleGroups) {
    setsPerMuscle[mg] = 0;
  }

  for (const session of sessions) {
    if ((session as any).status !== 'completed') continue;

    const setLogs = await database
      .get<SetLog>('set_logs')
      .query(Q.where('workout_session_id', session.id), Q.where('is_completed', true))
      .fetch();

    for (const setLog of setLogs) {
      const muscleGroupsStr = (setLog as any).muscle_groups;
      if (typeof muscleGroupsStr === 'string') {
        try {
          const mgs = JSON.parse(muscleGroupsStr);
          for (const mg of mgs) {
            if (setsPerMuscle[mg] !== undefined) {
              setsPerMuscle[mg]++;
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  // Calculate status for each muscle group
  const results: VolumeMetrics[] = muscleGroups.map((mg) => {
    const weeklySets = setsPerMuscle[mg] || 0;
    const mev = defaultMEV[mg] || 10;
    const mrv = defaultMRV[mg] || 20;

    let status: 'under' | 'optimal' | 'over' | 'maxed';
    if (weeklySets < mev) {
      status = 'under';
    } else if (weeklySets >= mev && weeklySets <= mrv) {
      status = 'optimal';
    } else if (weeklySets > mrv && weeklySets <= mrv * 1.2) {
      status = 'over';
    } else {
      status = 'maxed';
    }

    return {
      muscleGroup: mg,
      weeklySets,
      mev,
      mrv,
      status,
    };
  });

  return results;
}

/**
 * Get muscles that are under-trained (below MEV)
 */
export function getUnderTrainedMuscles(volumeMetrics: VolumeMetrics[]): string[] {
  return volumeMetrics.filter((m) => m.status === 'under').map((m) => m.muscleGroup);
}

/**
 * Get muscles that are over-trained (above MRV)
 */
export function getOverTrainedMuscles(volumeMetrics: VolumeMetrics[]): string[] {
  return volumeMetrics
    .filter((m) => m.status === 'over' || m.status === 'maxed')
    .map((m) => m.muscleGroup);
}

export interface VolumeRecommendation {
  type: 'increase' | 'maintain' | 'decrease';
  message: string;
}

/**
 * Generate volume recommendation based on current metrics
 */
export function getVolumeRecommendation(volumeMetrics: VolumeMetrics[]): VolumeRecommendation {
  const underTrained = getUnderTrainedMuscles(volumeMetrics);
  const overTrained = getOverTrainedMuscles(volumeMetrics);

  if (underTrained.length > 0) {
    return {
      type: 'increase',
      message: `Focus on ${underTrained.slice(0, 3).join(', ')} - you're below minimum effective volume.`,
    };
  }

  if (overTrained.length > 0) {
    return {
      type: 'decrease',
      message: `Consider reducing volume for ${overTrained.slice(0, 3).join(', ')} - you're approaching recovery limits.`,
    };
  }

  return {
    type: 'maintain',
    message: 'Your volume distribution is optimal. Keep it up!',
  };
}
