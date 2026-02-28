import {
  calculateVolumeTolerance,
  getVolumeRecommendation,
  getUnderTrainedMuscles,
  getOverTrainedMuscles,
  VolumeMetrics,
} from './volume-tolerance';
import {
  calculateRecoveryRate,
  getRecoveryRecommendations,
  canTrainToday,
  RecoveryMetrics,
} from './recovery-rate';
import {
  analyzeExerciseCompatibility,
  getBlacklistedExercises,
  ExerciseCompatibilityResult,
} from './exercise-compatibility';
import {
  analyzeTechniqueEffectiveness,
  getExercisesNeedingWork,
  getTopPerformingExercises,
  TechniqueEffectivenessResult,
} from './technique-effectiveness';
import {
  calculateStressImpact,
  getStressBasedModifications,
  StressImpactResult,
} from './stress-impact';
import {
  analyzePlateau,
  getPlateauExercises,
  getPlateauRecommendations,
  PlateauDetectionResult,
} from './plateau-detection';
import {
  analyzeAutonomyLevel,
  getAutonomyRecommendations,
  AutonomyProgressionResult,
} from './autonomy-progression';

export interface WeeklyAdaptationReport {
  timestamp: number;
  userId: string;

  // Volume analysis
  volumeMetrics: VolumeMetrics[];
  volumeRecommendation: ReturnType<typeof getVolumeRecommendation>;

  // Recovery analysis
  recoveryMetrics: RecoveryMetrics;
  recoveryRecommendations: string[];
  canTrainToday: ReturnType<typeof canTrainToday>;

  // Stress analysis
  stressMetrics: StressImpactResult;
  stressModifications: ReturnType<typeof getStressBasedModifications>;

  // Exercise compatibility
  exerciseAnalysis: ExerciseCompatibilityResult[];
  blacklistedExercises: string[];

  // Technique analysis
  techniqueAnalysis: TechniqueEffectivenessResult[];
  exercisesNeedingWork: TechniqueEffectivenessResult[];
  topPerforming: TechniqueEffectivenessResult[];

  // Plateau detection
  plateauAnalysis: PlateauDetectionResult[];
  plateauRecommendations: ReturnType<typeof getPlateauRecommendations>;

  // Autonomy
  autonomyMetrics: AutonomyProgressionResult;
  autonomyRecommendations: string[];

  // Summary
  summary: string;
  priorityActions: string[];
}

/**
 * Weekly Adaptation Runner
 * Combines all AI algorithms to generate a comprehensive weekly adaptation report
 */
export async function generateWeeklyAdaptationReport(
  userId: string,
): Promise<WeeklyAdaptationReport> {
  console.log('[AI Coach] Generating weekly adaptation report...');

  // 1. Volume Analysis
  const muscleGroups = [
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
  ];
  const volumeMetrics = await calculateVolumeTolerance(userId, muscleGroups);
  const volumeRecommendation = getVolumeRecommendation(volumeMetrics);

  // 2. Recovery Analysis
  const recoveryMetrics = await calculateRecoveryRate(userId);
  const recoveryRecommendations = getRecoveryRecommendations(recoveryMetrics);
  const trainStatus = canTrainToday(recoveryMetrics);

  // 3. Stress Analysis
  const stressMetrics = await calculateStressImpact(userId);
  const stressModifications = getStressBasedModifications(stressMetrics);

  // 4. Exercise Compatibility (would need to iterate through exercises)
  const exerciseAnalysis: ExerciseCompatibilityResult[] = [];
  const blacklistedExercises: string[] = [];

  // 5. Technique Analysis
  const techniqueAnalysis: TechniqueEffectivenessResult[] = [];
  // Would analyze actual exercises used

  // 6. Plateau Detection
  const plateauAnalysis: PlateauDetectionResult[] = [];
  // Would analyze actual exercises

  // 7. Autonomy Analysis
  const autonomyMetrics = await analyzeAutonomyLevel(userId);
  const autonomyRecommendations = getAutonomyRecommendations(autonomyMetrics);

  // Generate summary
  const underTrained = getUnderTrainedMuscles(volumeMetrics);
  const overTrained = getOverTrainedMuscles(volumeMetrics);

  const summaryParts: string[] = [];

  if (underTrained.length > 0) {
    summaryParts.push(`Focus on ${underTrained.slice(0, 3).join(', ')} - below minimum volume`);
  }

  if (overTrained.length > 0) {
    summaryParts.push(
      `Reduce volume for ${overTrained.slice(0, 3).join(', ')} - approaching limits`,
    );
  }

  if (recoveryMetrics.status !== 'recovered') {
    summaryParts.push(
      `Recovery: ${recoveryMetrics.status} - ${recoveryMetrics.suggestedRestDays} rest day(s) recommended`,
    );
  }

  if (stressMetrics.level === 'high' || stressMetrics.level === 'extreme') {
    summaryParts.push(`High stress: ${stressMetrics.level} - adjust training accordingly`);
  }

  const summary =
    summaryParts.length > 0
      ? summaryParts.join('. ')
      : 'Your training is balanced. Keep up the good work!';

  // Generate priority actions
  const priorityActions: string[] = [];

  if (stressMetrics.level === 'extreme') {
    priorityActions.push('🛑 PRIORITY: Take rest days immediately - extreme stress detected');
  }

  if (recoveryMetrics.status === 'overtrained') {
    priorityActions.push('🔴 PRIORITY: Recovery needed - consider deload week');
  }

  if (underTrained.length > 0) {
    priorityActions.push(`📈 Add volume to: ${underTrained.slice(0, 2).join(', ')}`);
  }

  if (trainStatus.canTrain) {
    priorityActions.push("✅ You're ready to train today!");
  } else {
    priorityActions.push(`⚠️ ${trainStatus.reason}`);
  }

  return {
    timestamp: Date.now(),
    userId,
    volumeMetrics,
    volumeRecommendation,
    recoveryMetrics,
    recoveryRecommendations,
    canTrainToday: trainStatus,
    stressMetrics,
    stressModifications,
    exerciseAnalysis,
    blacklistedExercises,
    techniqueAnalysis,
    exercisesNeedingWork: [],
    topPerforming: [],
    plateauAnalysis,
    plateauRecommendations: { critical: [], warnings: [], tips: [] },
    autonomyMetrics,
    autonomyRecommendations,
    summary,
    priorityActions,
  };
}

/**
 * Quick status check - lighter weight version for home screen
 */
export async function getQuickStatus(userId: string): Promise<{
  canTrain: boolean;
  primaryMessage: string;
  secondaryMessage: string;
}> {
  try {
    const recovery = await calculateRecoveryRate(userId);
    await calculateStressImpact(userId);
    const volume = await calculateVolumeTolerance(userId, ['chest', 'back', 'shoulders', 'quads']);

    const trainStatus = canTrainToday(recovery);
    const volumeRec = getVolumeRecommendation(volume);

    return {
      canTrain: trainStatus.canTrain,
      primaryMessage: trainStatus.reason,
      secondaryMessage: volumeRec.message,
    };
  } catch {
    return {
      canTrain: true,
      primaryMessage: 'Ready to train!',
      secondaryMessage: 'Track your workouts to get personalized recommendations',
    };
  }
}

// Export all algorithms
export {
  // Volume
  calculateVolumeTolerance,
  getVolumeRecommendation,
  getUnderTrainedMuscles,
  getOverTrainedMuscles,
  type VolumeMetrics,

  // Recovery
  calculateRecoveryRate,
  getRecoveryRecommendations,
  canTrainToday,
  type RecoveryMetrics,

  // Exercise Compatibility
  analyzeExerciseCompatibility,
  getBlacklistedExercises,
  type ExerciseCompatibilityResult,

  // Technique
  analyzeTechniqueEffectiveness,
  getExercisesNeedingWork,
  getTopPerformingExercises,
  type TechniqueEffectivenessResult,

  // Stress
  calculateStressImpact,
  getStressBasedModifications,
  type StressImpactResult,

  // Plateau
  analyzePlateau,
  getPlateauExercises,
  getPlateauRecommendations,
  type PlateauDetectionResult,

  // Autonomy
  analyzeAutonomyLevel,
  getAutonomyRecommendations,
  type AutonomyProgressionResult,
};
