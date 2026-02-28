import {
  useWorkoutStore,
  buildSetsForExercise,
  type ActiveExercise,
} from '../stores/workout-store';
import { usePRStore } from '../stores/pr-store';

jest.mock('@/lib/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

function buildTestExercises(): ActiveExercise[] {
  return [
    {
      exerciseName: 'Bench Press',
      muscleGroups: ['chest'],
      equipment: 'barbell',
      sets: buildSetsForExercise(3, 8),
    },
    {
      exerciseName: 'Incline DB Press',
      muscleGroups: ['chest'],
      equipment: 'dumbbell',
      sets: buildSetsForExercise(3, 10),
    },
  ];
}

describe('Workout Execution Flow', () => {
  beforeEach(() => {
    useWorkoutStore.getState().reset();
    usePRStore.setState({ records: {}, totalPRCount: 0 });
  });

  it('starts a workout with correct initial state', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    const state = useWorkoutStore.getState();
    expect(state.status).toBe('active');
    expect(state.workoutName).toBe('Push Day');
    expect(state.exercises).toHaveLength(2);
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.elapsedSeconds).toBe(0);
  });

  it('enters weight and reps for a set', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    useWorkoutStore.getState().updateSet(0, setId, { weight: 185, reps: 8 });

    const set = useWorkoutStore.getState().exercises[0].sets[0];
    expect(set.weight).toBe(185);
    expect(set.reps).toBe(8);
    expect(set.isCompleted).toBe(false);
  });

  it('completes a set', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    useWorkoutStore.getState().updateSet(0, setId, { weight: 185, reps: 8 });
    useWorkoutStore.getState().completeSet(0, setId);

    const set = useWorkoutStore.getState().exercises[0].sets[0];
    expect(set.isCompleted).toBe(true);
  });

  it('navigates between exercises', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(0);
    useWorkoutStore.getState().nextExercise();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1);
    useWorkoutStore.getState().prevExercise();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(0);
  });

  it('does not navigate past boundaries', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    useWorkoutStore.getState().prevExercise();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(0);

    useWorkoutStore.getState().nextExercise();
    useWorkoutStore.getState().nextExercise();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1);
  });

  it('adds and removes sets', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    expect(useWorkoutStore.getState().exercises[0].sets).toHaveLength(3);
    useWorkoutStore.getState().addSet(0);
    expect(useWorkoutStore.getState().exercises[0].sets).toHaveLength(4);

    const lastSetId = useWorkoutStore.getState().exercises[0].sets[3].id;
    useWorkoutStore.getState().removeSet(0, lastSetId);
    expect(useWorkoutStore.getState().exercises[0].sets).toHaveLength(3);
  });

  it('changes set type', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    useWorkoutStore.getState().changeSetType(0, setId, 'warmup');

    expect(useWorkoutStore.getState().exercises[0].sets[0].setType).toBe('warmup');
  });

  it('adds warm-up sets', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    useWorkoutStore.getState().addWarmupSets(0, 185);
    const sets = useWorkoutStore.getState().exercises[0].sets;

    expect(sets.length).toBe(6);
    expect(sets[0].setType).toBe('warmup');
    expect(sets[1].setType).toBe('warmup');
    expect(sets[2].setType).toBe('warmup');
    expect(sets[0].weight).toBe(95);
    expect(sets[1].weight).toBe(120);
    expect(sets[2].weight).toBe(150);
  });

  it('swaps an exercise', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    useWorkoutStore.getState().swapExercise(
      0,
      {
        exerciseName: 'Dumbbell Bench Press',
        muscleGroups: ['chest', 'triceps'],
        equipment: 'dumbbell',
      },
      4,
      10,
    );

    const ex = useWorkoutStore.getState().exercises[0];
    expect(ex.exerciseName).toBe('Dumbbell Bench Press');
    expect(ex.equipment).toBe('dumbbell');
    expect(ex.sets).toHaveLength(4);
  });

  it('completes full workout and generates summary', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    for (let exIdx = 0; exIdx < 2; exIdx++) {
      const ex = useWorkoutStore.getState().exercises[exIdx];
      for (const set of ex.sets) {
        useWorkoutStore.getState().updateSet(exIdx, set.id, { weight: 135, reps: 8 });
        useWorkoutStore.getState().completeSet(exIdx, set.id);
      }
    }

    useWorkoutStore.getState().endWorkout();
    const state = useWorkoutStore.getState();

    expect(state.status).toBe('completed');
    expect(state.completedSummary).not.toBeNull();
    expect(state.completedSummary!.workoutName).toBe('Push Day');
    expect(state.completedSummary!.totalSetsCompleted).toBe(6);
    expect(state.completedSummary!.totalVolume).toBe(135 * 8 * 6);
    expect(state.completedSummary!.exercises).toHaveLength(2);
  });

  it('detects PRs during workout', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id;
    useWorkoutStore.getState().updateSet(0, setId, { weight: 225, reps: 5 });

    const result = usePRStore.getState().checkForPR('Bench Press', 225, 5);
    expect(result.isNewPR).toBe(true);
    expect(result.types).toContain('weight');
  });

  it('resets cleanly after workout', () => {
    const exercises = buildTestExercises();
    useWorkoutStore.getState().startWorkout('Push Day', exercises);
    useWorkoutStore.getState().endWorkout();
    useWorkoutStore.getState().reset();

    const state = useWorkoutStore.getState();
    expect(state.status).toBe('idle');
    expect(state.exercises).toHaveLength(0);
    expect(state.completedSummary).toBeNull();
  });
});
