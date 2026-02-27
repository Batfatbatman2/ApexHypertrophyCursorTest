import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class SetLog extends Model {
  static table = 'set_logs';

  static associations = {
    workout_sessions: { type: 'belongs_to' as const, key: 'workout_session_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('workout_session_id') workoutSessionId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('set_number') setNumber!: number;
  @field('set_type') setType!: string;
  @field('weight') weight!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe!: number | null;
  @field('muscle_connection') muscleConnection!: number | null;
  @field('is_completed') isCompleted!: boolean;
  @field('notes') notes!: string | null;
  @field('parent_set_id') parentSetId!: string | null;
  @readonly @date('created_at') createdAt!: Date;

  @relation('workout_sessions', 'workout_session_id') workoutSession: any;
  @relation('exercises', 'exercise_id') exercise: any;
}
