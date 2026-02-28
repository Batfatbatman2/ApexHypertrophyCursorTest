// Weekly adaptation - main entry points
export { generateWeeklyAdaptationReport, getQuickStatus } from './weekly-adaptation';
export type { WeeklyAdaptationReport } from './weekly-adaptation';

// Volume Tolerance
export {
  calculateVolumeTolerance,
  getUnderTrainedMuscles,
  getOverTrainedMuscles,
  getVolumeRecommendation,
} from './volume-tolerance';
export type { VolumeMetrics, VolumeRecommendation } from './volume-tolerance';

// Recovery Rate
export { calculateRecoveryRate, getRecoveryRecommendations, canTrainToday } from './recovery-rate';
export type { RecoveryMetrics } from './recovery-rate';

// Exercise Compatibility
export { analyzeExerciseCompatibility, getBlacklistedExercises } from './exercise-compatibility';
export type { ExerciseCompatibilityResult, ExerciseStatus } from './exercise-compatibility';

// Technique Effectiveness
export {
  analyzeTechniqueEffectiveness,
  getExercisesNeedingWork,
  getTopPerformingExercises,
} from './technique-effectiveness';
export type { TechniqueEffectivenessResult } from './technique-effectiveness';

// Stress Impact
export { calculateStressImpact, getStressBasedModifications } from './stress-impact';
export type { StressImpactResult } from './stress-impact';

// Plateau Detection
export {
  analyzePlateau,
  getPlateauExercises,
  getPlateauRecommendations,
} from './plateau-detection';
export type { PlateauDetectionResult } from './plateau-detection';

// Autonomy Progression
export { analyzeAutonomyLevel, getAutonomyRecommendations } from './autonomy-progression';
export type { AutonomyProgressionResult, AutonomyLevel } from './autonomy-progression';
