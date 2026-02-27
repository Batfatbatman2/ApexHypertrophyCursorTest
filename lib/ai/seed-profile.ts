import type { OnboardingData } from '@/stores/onboarding-store';

export interface AIProfile {
  mevPerMuscle: Record<string, number>;
  mrvPerMuscle: Record<string, number>;
  optimalVolumeZone: Record<string, [number, number]>;
  volumeSensitivity: number;
  recoveryHours: number;
  stressMultiplier: number;
  fatigueIndex: number;
  learningPhase: 'initial' | 'calibrating' | 'optimized' | 'plateau';
}

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
  'forearms',
  'traps',
];

/**
 * Seeds an initial AI learning profile from onboarding answers.
 * These are starting estimates that the adaptive engine will refine over time.
 */
export function seedAIProfile(data: OnboardingData): AIProfile {
  const volumeMultiplier =
    data.trainingAge === 'beginner' ? 0.7 : data.trainingAge === 'intermediate' ? 1.0 : 1.3;

  const recoveryBase =
    data.trainingAge === 'beginner' ? 72 : data.trainingAge === 'intermediate' ? 48 : 36;

  const ageRecoveryPenalty = data.age && data.age > 40 ? (data.age - 40) * 0.5 : 0;

  const mevPerMuscle: Record<string, number> = {};
  const mrvPerMuscle: Record<string, number> = {};
  const optimalVolumeZone: Record<string, [number, number]> = {};

  for (const muscle of MUSCLE_GROUPS) {
    const baseMev = 6;
    const baseMrv = 20;
    mevPerMuscle[muscle] = Math.round(baseMev * volumeMultiplier);
    mrvPerMuscle[muscle] = Math.round(baseMrv * volumeMultiplier);
    optimalVolumeZone[muscle] = [
      Math.round((baseMev + 2) * volumeMultiplier),
      Math.round((baseMrv - 4) * volumeMultiplier),
    ];
  }

  return {
    mevPerMuscle,
    mrvPerMuscle,
    optimalVolumeZone,
    volumeSensitivity: data.trainingAge === 'beginner' ? 0.8 : 0.5,
    recoveryHours: Math.round(recoveryBase + ageRecoveryPenalty),
    stressMultiplier: 1.0,
    fatigueIndex: 0,
    learningPhase: 'initial',
  };
}
