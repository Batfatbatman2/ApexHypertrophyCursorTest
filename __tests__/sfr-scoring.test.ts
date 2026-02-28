import { computeSFR, determineExerciseStatus, type ExerciseFeedback } from '../lib/ai/sfr-scoring';

describe('SFR Scoring Engine', () => {
  describe('computeSFR', () => {
    it('returns population average when no feedback exists', () => {
      const result = computeSFR(8, undefined);
      expect(result.score).toBe(4); // (8/10) * 5 = 4
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('population average');
    });

    it('returns low confidence with insufficient data', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Bench Press',
        avgMuscleConnection: 4,
        avgRpe: 8,
        totalSets: 2,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const result = computeSFR(8, feedback);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasoning).toContain('need more data');
    });

    it('computes full SFR with sufficient feedback', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Barbell Bench Press',
        avgMuscleConnection: 4.5,
        avgRpe: 8,
        totalSets: 20,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const result = computeSFR(9, feedback);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(5);
      expect(result.confidence).toBe(1);
      expect(result.connectionScore).toBe(4.5);
      expect(result.painPenalty).toBe(0);
    });

    it('applies pain penalty correctly', () => {
      const noPain: ExerciseFeedback = {
        exerciseName: 'Squat',
        avgMuscleConnection: 4,
        avgRpe: 8,
        totalSets: 10,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const withPain: ExerciseFeedback = {
        ...noPain,
        painReports: 5,
      };
      const noPainScore = computeSFR(8, noPain);
      const painScore = computeSFR(8, withPain);
      expect(painScore.score).toBeLessThan(noPainScore.score);
      expect(painScore.painPenalty).toBeGreaterThan(0);
      expect(painScore.reasoning).toContain('Pain reported');
    });

    it('clamps score between 0 and 5', () => {
      const excellent: ExerciseFeedback = {
        exerciseName: 'Cable Fly',
        avgMuscleConnection: 5,
        avgRpe: 7,
        totalSets: 30,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const result = computeSFR(10, excellent);
      expect(result.score).toBeLessThanOrEqual(5);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('adds connection praise for high muscle connection', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Lateral Raise',
        avgMuscleConnection: 4.5,
        avgRpe: 7.5,
        totalSets: 15,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const result = computeSFR(9, feedback);
      expect(result.reasoning).toContain('mind-muscle connection');
    });
  });

  describe('determineExerciseStatus', () => {
    it('returns experimental with no feedback', () => {
      const sfr = computeSFR(7, undefined);
      expect(determineExerciseStatus(sfr)).toBe('experimental');
    });

    it('returns proven with high SFR and confidence', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Bench Press',
        avgMuscleConnection: 4,
        avgRpe: 8,
        totalSets: 20,
        painReports: 0,
        lastPerformed: Date.now(),
      };
      const sfr = computeSFR(8, feedback);
      expect(determineExerciseStatus(sfr, feedback)).toBe('proven');
    });

    it('returns blacklisted with high pain ratio', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Behind Neck Press',
        avgMuscleConnection: 2,
        avgRpe: 9,
        totalSets: 10,
        painReports: 4,
        lastPerformed: Date.now(),
      };
      const sfr = computeSFR(5, feedback);
      expect(determineExerciseStatus(sfr, feedback)).toBe('blacklisted');
    });

    it('does not blacklist with low pain ratio', () => {
      const feedback: ExerciseFeedback = {
        exerciseName: 'Squat',
        avgMuscleConnection: 3,
        avgRpe: 8,
        totalSets: 20,
        painReports: 1,
        lastPerformed: Date.now(),
      };
      const sfr = computeSFR(8, feedback);
      expect(determineExerciseStatus(sfr, feedback)).not.toBe('blacklisted');
    });
  });
});
