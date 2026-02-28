import { usePRStore } from '../stores/pr-store';
import type { WorkoutSummaryData } from '../stores/workout-store';

function makeWorkout(overrides: Partial<WorkoutSummaryData> = {}): WorkoutSummaryData {
  return {
    workoutName: 'Test',
    durationSeconds: 3600,
    totalVolume: 10000,
    totalSetsCompleted: 10,
    totalSetsPlanned: 10,
    averageRpe: 8,
    completedAt: Date.now(),
    prs: [],
    exercises: [],
    ...overrides,
  };
}

describe('PR Store', () => {
  beforeEach(() => {
    usePRStore.setState({ records: {}, totalPRCount: 0 });
  });

  describe('checkForPR', () => {
    it('detects new PR on first check (no history)', () => {
      const result = usePRStore.getState().checkForPR('Bench Press', 185, 8);
      expect(result.isNewPR).toBe(true);
      expect(result.types).toContain('weight');
      expect(result.types).toContain('reps');
      expect(result.types).toContain('volume');
    });

    it('returns false for zero weight', () => {
      const result = usePRStore.getState().checkForPR('Bench Press', 0, 8);
      expect(result.isNewPR).toBe(false);
    });

    it('returns false for zero reps', () => {
      const result = usePRStore.getState().checkForPR('Bench Press', 185, 0);
      expect(result.isNewPR).toBe(false);
    });
  });

  describe('buildFromHistory', () => {
    it('builds PR records from workout history', () => {
      const workouts: WorkoutSummaryData[] = [
        makeWorkout({
          completedAt: Date.now() - 86400000,
          exercises: [
            {
              exerciseName: 'Bench Press',
              muscleGroups: ['chest'],
              equipment: 'barbell',
              completedSets: 3,
              totalSets: 3,
              totalVolume: 4440,
              topWeight: 185,
              topReps: 8,
              avgRpe: 8,
              sets: [
                {
                  id: '1',
                  setNumber: 1,
                  setType: 'working',
                  weight: 185,
                  reps: 8,
                  rpe: 8,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
                {
                  id: '2',
                  setNumber: 2,
                  setType: 'working',
                  weight: 185,
                  reps: 7,
                  rpe: 8.5,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
                {
                  id: '3',
                  setNumber: 3,
                  setType: 'working',
                  weight: 185,
                  reps: 6,
                  rpe: 9,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
          ],
        }),
      ];

      usePRStore.getState().buildFromHistory(workouts);
      const state = usePRStore.getState();

      expect(state.totalPRCount).toBeGreaterThan(0);
      const prs = state.getExercisePRs('Bench Press');
      expect(prs).not.toBeNull();
      expect(prs!.weightPR?.weight).toBe(185);
      expect(prs!.repsPR?.reps).toBe(8);
      expect(prs!.volumePR?.value).toBe(4440);
    });

    it('detects higher weight PR from later workout', () => {
      const workouts: WorkoutSummaryData[] = [
        makeWorkout({
          completedAt: Date.now() - 86400000 * 2,
          exercises: [
            {
              exerciseName: 'Squat',
              muscleGroups: ['quads'],
              equipment: 'barbell',
              completedSets: 1,
              totalSets: 1,
              totalVolume: 1350,
              topWeight: 225,
              topReps: 6,
              avgRpe: 8,
              sets: [
                {
                  id: '1',
                  setNumber: 1,
                  setType: 'working',
                  weight: 225,
                  reps: 6,
                  rpe: 8,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
          ],
        }),
        makeWorkout({
          completedAt: Date.now() - 86400000,
          exercises: [
            {
              exerciseName: 'Squat',
              muscleGroups: ['quads'],
              equipment: 'barbell',
              completedSets: 1,
              totalSets: 1,
              totalVolume: 1425,
              topWeight: 285,
              topReps: 5,
              avgRpe: 9,
              sets: [
                {
                  id: '2',
                  setNumber: 1,
                  setType: 'working',
                  weight: 285,
                  reps: 5,
                  rpe: 9,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
          ],
        }),
      ];

      usePRStore.getState().buildFromHistory(workouts);
      const prs = usePRStore.getState().getExercisePRs('Squat');
      expect(prs!.weightPR?.weight).toBe(285);
    });

    it('checks PR against built history', () => {
      const workouts: WorkoutSummaryData[] = [
        makeWorkout({
          exercises: [
            {
              exerciseName: 'OHP',
              muscleGroups: ['shoulders'],
              equipment: 'barbell',
              completedSets: 1,
              totalSets: 1,
              totalVolume: 800,
              topWeight: 135,
              topReps: 6,
              avgRpe: 8,
              sets: [
                {
                  id: '1',
                  setNumber: 1,
                  setType: 'working',
                  weight: 135,
                  reps: 6,
                  rpe: 8,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
          ],
        }),
      ];

      usePRStore.getState().buildFromHistory(workouts);
      const notPR = usePRStore.getState().checkForPR('OHP', 100, 4);
      expect(notPR.isNewPR).toBe(false);

      const newPR = usePRStore.getState().checkForPR('OHP', 145, 6);
      expect(newPR.isNewPR).toBe(true);
      expect(newPR.types).toContain('weight');
      expect(newPR.types).toContain('volume');
    });
  });

  describe('getAllPRs', () => {
    it('returns all PRs across exercises', () => {
      const workouts: WorkoutSummaryData[] = [
        makeWorkout({
          exercises: [
            {
              exerciseName: 'Bench Press',
              muscleGroups: ['chest'],
              equipment: 'barbell',
              completedSets: 1,
              totalSets: 1,
              totalVolume: 1480,
              topWeight: 185,
              topReps: 8,
              avgRpe: 8,
              sets: [
                {
                  id: '1',
                  setNumber: 1,
                  setType: 'working',
                  weight: 185,
                  reps: 8,
                  rpe: 8,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
            {
              exerciseName: 'Squat',
              muscleGroups: ['quads'],
              equipment: 'barbell',
              completedSets: 1,
              totalSets: 1,
              totalVolume: 1575,
              topWeight: 315,
              topReps: 5,
              avgRpe: 9,
              sets: [
                {
                  id: '2',
                  setNumber: 1,
                  setType: 'working',
                  weight: 315,
                  reps: 5,
                  rpe: 9,
                  muscleConnection: null,
                  isCompleted: true,
                  parentSetId: null,
                  notes: '',
                  ghostWeight: null,
                  ghostReps: null,
                },
              ],
            },
          ],
        }),
      ];
      usePRStore.getState().buildFromHistory(workouts);
      const all = usePRStore.getState().getAllPRs();
      expect(all.length).toBeGreaterThanOrEqual(4);
    });
  });
});
