/**
 * Weekly Adaptation Algorithms — Client-side implementations
 *
 * Seven algorithms that analyze training data to generate
 * personalized recommendations.
 */

import type { WorkoutSummaryData } from '@/stores/workout-store';
import type { ReadinessEntry } from '@/stores/readiness-store';

export interface VolumeStatus {
  muscle: string;
  weekSets: number;
  mev: number;
  mrv: number;
  status: 'below_mev' | 'in_zone' | 'approaching_mrv' | 'above_mrv';
}

export interface AdaptationResult {
  volumeStatus: VolumeStatus[];
  recoveryScore: number;
  plateauDetected: boolean;
  deloadRecommended: boolean;
  suggestedChanges: string[];
}

const WEEK_MS = 7 * 86400000;

function getRecentWorkouts(workouts: WorkoutSummaryData[], weeks: number): WorkoutSummaryData[] {
  const cutoff = Date.now() - weeks * WEEK_MS;
  return workouts.filter((w) => w.completedAt >= cutoff);
}

function getMuscleVolume(workouts: WorkoutSummaryData[]): Record<string, number> {
  const vol: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const mg of ex.muscleGroups) {
        const key = mg.toLowerCase();
        vol[key] = (vol[key] ?? 0) + ex.completedSets;
      }
    }
  }
  return vol;
}

export function analyzeVolumeTolerance(
  workouts: WorkoutSummaryData[],
  mevPerMuscle: Record<string, number>,
  mrvPerMuscle: Record<string, number>,
): VolumeStatus[] {
  const recent = getRecentWorkouts(workouts, 1);
  const vol = getMuscleVolume(recent);

  return Object.keys(mevPerMuscle).map((muscle) => {
    const weekSets = vol[muscle] ?? 0;
    const mev = mevPerMuscle[muscle] ?? 6;
    const mrv = mrvPerMuscle[muscle] ?? 20;

    let status: VolumeStatus['status'];
    if (weekSets < mev) status = 'below_mev';
    else if (weekSets > mrv) status = 'above_mrv';
    else if (weekSets > mrv * 0.85) status = 'approaching_mrv';
    else status = 'in_zone';

    return { muscle, weekSets, mev, mrv, status };
  });
}

export function analyzeRecoveryRate(workouts: WorkoutSummaryData[]): number {
  const recent = getRecentWorkouts(workouts, 2);
  if (recent.length < 2) return 100;

  const rpeValues = recent.map((w) => w.averageRpe).filter((v): v is number => v !== null);

  if (rpeValues.length === 0) return 100;

  const avgRpe = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
  const trend =
    rpeValues.length >= 4
      ? rpeValues.slice(0, 2).reduce((a, b) => a + b, 0) / 2 -
        rpeValues.slice(-2).reduce((a, b) => a + b, 0) / 2
      : 0;

  let score = 100;
  if (avgRpe > 9) score -= 30;
  else if (avgRpe > 8.5) score -= 15;
  if (trend > 0.5) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function detectPlateau(workouts: WorkoutSummaryData[]): boolean {
  if (workouts.length < 8) return false;

  const recent4 = workouts.slice(0, 4);
  const older4 = workouts.slice(4, 8);

  const recentVol = recent4.reduce((s, w) => s + w.totalVolume, 0) / recent4.length;
  const olderVol = older4.reduce((s, w) => s + w.totalVolume, 0) / older4.length;

  return olderVol > 0 && Math.abs(recentVol - olderVol) / olderVol < 0.03;
}

export function shouldDeload(workouts: WorkoutSummaryData[], readiness: ReadinessEntry[]): boolean {
  const recentRpe = workouts
    .slice(0, 5)
    .map((w) => w.averageRpe)
    .filter((v): v is number => v !== null);
  const avgRpe = recentRpe.length > 0 ? recentRpe.reduce((a, b) => a + b, 0) / recentRpe.length : 0;

  const recentReadiness = readiness.filter((r) => r.surveyedAt > Date.now() - WEEK_MS);
  const avgEnergy =
    recentReadiness.length > 0
      ? recentReadiness.reduce((s, r) => s + r.energyLevel, 0) / recentReadiness.length
      : 3;

  return avgRpe > 9.2 || avgEnergy < 2;
}

export function generateSuggestions(
  volumeStatus: VolumeStatus[],
  recoveryScore: number,
  plateauDetected: boolean,
  deloadRecommended: boolean,
): string[] {
  const suggestions: string[] = [];

  const belowMev = volumeStatus.filter((v) => v.status === 'below_mev' && v.mev > 0);
  if (belowMev.length > 0) {
    suggestions.push(
      `Add volume for ${belowMev
        .slice(0, 2)
        .map((v) => v.muscle)
        .join(' & ')} — currently below minimum effective volume`,
    );
  }

  const aboveMrv = volumeStatus.filter((v) => v.status === 'above_mrv');
  if (aboveMrv.length > 0) {
    suggestions.push(
      `Reduce volume for ${aboveMrv.map((v) => v.muscle).join(' & ')} — exceeding maximum recoverable volume`,
    );
  }

  if (deloadRecommended) {
    suggestions.push('Consider a deload week — fatigue indicators are elevated');
  } else if (recoveryScore < 60) {
    suggestions.push('Recovery is compromised — prioritize sleep and nutrition');
  }

  if (plateauDetected && !deloadRecommended) {
    suggestions.push('Volume has stagnated — try varying rep ranges or swapping exercises');
  }

  if (suggestions.length === 0) {
    suggestions.push('Training is on track — maintain current approach');
  }

  return suggestions;
}

export function runWeeklyAdaptation(
  workouts: WorkoutSummaryData[],
  readiness: ReadinessEntry[],
  mevPerMuscle: Record<string, number>,
  mrvPerMuscle: Record<string, number>,
): AdaptationResult {
  const volumeStatus = analyzeVolumeTolerance(workouts, mevPerMuscle, mrvPerMuscle);
  const recoveryScore = analyzeRecoveryRate(workouts);
  const plateauDetected = detectPlateau(workouts);
  const deloadRecommended = shouldDeload(workouts, readiness);
  const suggestedChanges = generateSuggestions(
    volumeStatus,
    recoveryScore,
    plateauDetected,
    deloadRecommended,
  );

  return {
    volumeStatus,
    recoveryScore,
    plateauDetected,
    deloadRecommended,
    suggestedChanges,
  };
}
