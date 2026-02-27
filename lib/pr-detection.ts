import type { PRRecord, ExerciseSummary } from '@/stores/workout-store';

export type PRType = 'weight' | 'reps' | 'volume';

export interface PRDisplayInfo {
  exerciseName: string;
  prType: PRType;
  label: string;
  value: string;
  icon: string;
}

const PR_LABELS: Record<PRType, { label: string; icon: string }> = {
  weight: { label: 'Weight PR', icon: '🏋️' },
  reps: { label: 'Rep PR', icon: '🔁' },
  volume: { label: 'Volume PR', icon: '📊' },
};

export function formatPRValue(pr: PRRecord, unit: string = 'lbs'): string {
  switch (pr.prType) {
    case 'weight':
      return `${pr.weight} ${unit}`;
    case 'reps':
      return `${pr.reps} reps @ ${pr.weight} ${unit}`;
    case 'volume':
      return `${pr.value.toLocaleString()} ${unit}`;
    default:
      return String(pr.value);
  }
}

export function getPRDisplayList(prs: PRRecord[], unit: string = 'lbs'): PRDisplayInfo[] {
  const seen = new Set<string>();
  const display: PRDisplayInfo[] = [];

  for (const pr of prs) {
    const key = `${pr.exerciseName}-${pr.prType}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const meta = PR_LABELS[pr.prType];
    display.push({
      exerciseName: pr.exerciseName,
      prType: pr.prType,
      label: meta.label,
      value: formatPRValue(pr, unit),
      icon: meta.icon,
    });
  }

  return display;
}

export function detectPRsFromExercises(exercises: ExerciseSummary[]): PRRecord[] {
  const prs: PRRecord[] = [];

  for (const ex of exercises) {
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) continue;

    const maxWeight = Math.max(...completed.map((s) => s.weight));
    const maxWeightSet = completed.find((s) => s.weight === maxWeight);
    if (maxWeightSet && maxWeight > 0) {
      prs.push({
        exerciseName: ex.exerciseName,
        prType: 'weight',
        value: maxWeight,
        weight: maxWeightSet.weight,
        reps: maxWeightSet.reps,
      });
    }

    const maxVolume = Math.max(...completed.map((s) => s.weight * s.reps));
    const maxVolumeSet = completed.find((s) => s.weight * s.reps === maxVolume);
    if (maxVolumeSet && maxVolume > 0) {
      prs.push({
        exerciseName: ex.exerciseName,
        prType: 'volume',
        value: maxVolume,
        weight: maxVolumeSet.weight,
        reps: maxVolumeSet.reps,
      });
    }
  }

  return prs;
}
