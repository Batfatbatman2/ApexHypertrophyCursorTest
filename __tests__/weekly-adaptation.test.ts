import {
  analyzeVolumeTolerance,
  analyzeRecoveryRate,
  detectPlateau,
  shouldDeload,
  generateSuggestions,
  runWeeklyAdaptation,
} from '../lib/ai/weekly-adaptation';
import type { WorkoutSummaryData } from '../stores/workout-store';

function makeWorkout(overrides: Partial<WorkoutSummaryData> = {}): WorkoutSummaryData {
  return {
    workoutName: 'Test',
    durationSeconds: 3600,
    totalVolume: 10000,
    totalSetsCompleted: 15,
    totalSetsPlanned: 15,
    averageRpe: 8,
    completedAt: Date.now(),
    prs: [],
    exercises: [],
    ...overrides,
  };
}

const MEV = { chest: 6, back: 6, quads: 6 };
const MRV = { chest: 20, back: 20, quads: 20 };

describe('Weekly Adaptation Algorithms', () => {
  describe('analyzeVolumeTolerance', () => {
    it('marks muscles below MEV', () => {
      const workouts = [
        makeWorkout({
          completedAt: Date.now() - 1000,
          exercises: [
            {
              exerciseName: 'Bench Press',
              muscleGroups: ['chest'],
              equipment: 'barbell',
              completedSets: 3,
              totalSets: 3,
              totalVolume: 3000,
              topWeight: 185,
              topReps: 8,
              avgRpe: 8,
              sets: [],
            },
          ],
        }),
      ];
      const result = analyzeVolumeTolerance(workouts, MEV, MRV);
      const chest = result.find((v) => v.muscle === 'chest');
      expect(chest?.weekSets).toBe(3);
      expect(chest?.status).toBe('below_mev');
    });

    it('marks muscles in optimal zone', () => {
      const workouts = [
        makeWorkout({
          completedAt: Date.now() - 1000,
          exercises: [
            {
              exerciseName: 'Bench Press',
              muscleGroups: ['chest'],
              equipment: 'barbell',
              completedSets: 12,
              totalSets: 12,
              totalVolume: 12000,
              topWeight: 185,
              topReps: 8,
              avgRpe: 8,
              sets: [],
            },
          ],
        }),
      ];
      const result = analyzeVolumeTolerance(workouts, MEV, MRV);
      const chest = result.find((v) => v.muscle === 'chest');
      expect(chest?.status).toBe('in_zone');
    });

    it('marks muscles above MRV', () => {
      const workouts = [
        makeWorkout({
          completedAt: Date.now() - 1000,
          exercises: [
            {
              exerciseName: 'Bench Press',
              muscleGroups: ['chest'],
              equipment: 'barbell',
              completedSets: 25,
              totalSets: 25,
              totalVolume: 25000,
              topWeight: 185,
              topReps: 8,
              avgRpe: 8,
              sets: [],
            },
          ],
        }),
      ];
      const result = analyzeVolumeTolerance(workouts, MEV, MRV);
      const chest = result.find((v) => v.muscle === 'chest');
      expect(chest?.status).toBe('above_mrv');
    });
  });

  describe('analyzeRecoveryRate', () => {
    it('returns 100 with insufficient data', () => {
      expect(analyzeRecoveryRate([])).toBe(100);
      expect(analyzeRecoveryRate([makeWorkout()])).toBe(100);
    });

    it('returns lower score with high RPE', () => {
      const workouts = Array.from({ length: 4 }, (_, i) =>
        makeWorkout({ averageRpe: 9.5, completedAt: Date.now() - i * 86400000 }),
      );
      const score = analyzeRecoveryRate(workouts);
      expect(score).toBeLessThan(80);
    });
  });

  describe('detectPlateau', () => {
    it('returns false with insufficient data', () => {
      expect(detectPlateau([])).toBe(false);
      expect(detectPlateau([makeWorkout()])).toBe(false);
    });

    it('detects plateau with stagnant volume', () => {
      const workouts = Array.from({ length: 8 }, (_, i) =>
        makeWorkout({ totalVolume: 10000, completedAt: Date.now() - i * 86400000 * 2 }),
      );
      expect(detectPlateau(workouts)).toBe(true);
    });

    it('does not flag plateau with growing volume', () => {
      const workouts = Array.from({ length: 8 }, (_, i) =>
        makeWorkout({
          totalVolume: 10000 + (8 - i) * 500,
          completedAt: Date.now() - i * 86400000 * 2,
        }),
      );
      expect(detectPlateau(workouts)).toBe(false);
    });
  });

  describe('shouldDeload', () => {
    it('recommends deload with very high RPE', () => {
      const workouts = Array.from({ length: 5 }, (_, i) =>
        makeWorkout({ averageRpe: 9.5, completedAt: Date.now() - i * 86400000 }),
      );
      expect(shouldDeload(workouts, [])).toBe(true);
    });

    it('does not recommend deload with moderate RPE', () => {
      const workouts = Array.from({ length: 5 }, (_, i) =>
        makeWorkout({ averageRpe: 7.5, completedAt: Date.now() - i * 86400000 }),
      );
      expect(shouldDeload(workouts, [])).toBe(false);
    });
  });

  describe('generateSuggestions', () => {
    it('suggests adding volume for under-trained muscles', () => {
      const status = [
        { muscle: 'chest', weekSets: 3, mev: 6, mrv: 20, status: 'below_mev' as const },
      ];
      const suggestions = generateSuggestions(status, 90, false, false);
      expect(suggestions.some((s) => s.includes('chest'))).toBe(true);
    });

    it('suggests deload when recommended', () => {
      const suggestions = generateSuggestions([], 50, false, true);
      expect(suggestions.some((s) => s.toLowerCase().includes('deload'))).toBe(true);
    });

    it('returns positive message when everything is fine', () => {
      const status = [
        { muscle: 'chest', weekSets: 12, mev: 6, mrv: 20, status: 'in_zone' as const },
      ];
      const suggestions = generateSuggestions(status, 90, false, false);
      expect(suggestions.some((s) => s.includes('on track'))).toBe(true);
    });
  });

  describe('runWeeklyAdaptation', () => {
    it('produces a complete result', () => {
      const result = runWeeklyAdaptation([], [], MEV, MRV);
      expect(result.volumeStatus).toBeDefined();
      expect(result.recoveryScore).toBeDefined();
      expect(typeof result.plateauDetected).toBe('boolean');
      expect(typeof result.deloadRecommended).toBe('boolean');
      expect(result.suggestedChanges.length).toBeGreaterThan(0);
    });
  });
});
