import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class ProgramExercise extends Model {
  static table = 'program_exercises';

  static associations = {
    workout_days: { type: 'belongs_to' as const, key: 'workout_day_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('workout_day_id') workoutDayId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('order_index') orderIndex!: number;
  @field('sets') sets!: number;
  @field('reps') reps!: number;
  @field('set_type') setType!: string;
  @field('notes') notes!: string | null;

  @relation('workout_days', 'workout_day_id') workoutDay: any;
  @relation('exercises', 'exercise_id') exercise: any;
}
