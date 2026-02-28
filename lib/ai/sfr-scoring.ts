/**
 * Stimulus-to-Fatigue Ratio (SFR) Scoring Engine
 *
 * Combines population-level SFR data with individual user feedback
 * to rank exercises by effectiveness for each user.
 *
 * Formula: (PopSFR × 0.3) + (Connection × 0.5) − (Pain × 0.2)
 */

export interface ExerciseFeedback {
  exerciseName: string;
  avgMuscleConnection: number;
  avgRpe: number;
  totalSets: number;
  painReports: number;
  lastPerformed: number;
}

export interface SFRScore {
  exerciseName: string;
  score: number;
  popSfr: number;
  connectionScore: number;
  painPenalty: number;
  confidence: number;
  reasoning: string;
}

export function computeSFR(popSfr: number, feedback: ExerciseFeedback | undefined): SFRScore {
  const name = feedback?.exerciseName ?? '';
  const normalizedPopSfr = (popSfr / 10) * 5;

  if (!feedback || feedback.totalSets < 3) {
    return {
      exerciseName: name,
      score: normalizedPopSfr,
      popSfr: normalizedPopSfr,
      connectionScore: 0,
      painPenalty: 0,
      confidence: feedback ? Math.min(feedback.totalSets / 10, 0.3) : 0,
      reasoning: feedback
        ? `Only ${feedback.totalSets} sets logged — need more data to personalize`
        : 'No personal data yet — using population average',
    };
  }

  const connectionScore = feedback.avgMuscleConnection;
  const painRatio = feedback.totalSets > 0 ? feedback.painReports / feedback.totalSets : 0;
  const painPenalty = painRatio * 5;

  const score = normalizedPopSfr * 0.3 + connectionScore * 0.5 - painPenalty * 0.2;
  const clampedScore = Math.max(0, Math.min(5, score));

  const confidence = Math.min(feedback.totalSets / 20, 1);

  let reasoning: string;
  if (clampedScore >= 4) reasoning = 'Excellent stimulus with minimal fatigue';
  else if (clampedScore >= 3) reasoning = 'Good effectiveness for your training';
  else if (clampedScore >= 2) reasoning = 'Moderate — consider alternatives';
  else reasoning = 'Low effectiveness — swap recommended';

  if (painPenalty > 1) reasoning += ' · Pain reported';
  if (connectionScore >= 4) reasoning += ' · Great mind-muscle connection';

  return {
    exerciseName: name,
    score: Math.round(clampedScore * 100) / 100,
    popSfr: normalizedPopSfr,
    connectionScore,
    painPenalty,
    confidence,
    reasoning,
  };
}

export type ExerciseStatus = 'proven' | 'experimental' | 'blacklisted';

export function determineExerciseStatus(
  sfr: SFRScore,
  feedback?: ExerciseFeedback,
): ExerciseStatus {
  if (feedback && feedback.painReports > 2 && feedback.painReports / feedback.totalSets > 0.3) {
    return 'blacklisted';
  }
  if (sfr.confidence >= 0.5 && sfr.score >= 2.5) {
    return 'proven';
  }
  return 'experimental';
}
