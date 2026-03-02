import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class SetLog extends Model {
  static table = 'set_logs';

  static associations = {
    workout_sessions: { type: 'belongs_to' as const, key: 'workout_session_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('workout_session_id') workoutSessionId = '';
  @field('exercise_id') exerciseId = '';
  @field('set_number') setNumber = 0;
  @field('set_type') setType = '';
  @field('weight') weight = 0;
  @field('reps') reps = 0;
  @field('rpe') rpe: number | null = null;
  @field('muscle_connection') muscleConnection: number | null = null;
  @field('is_completed') isCompleted = false;
  @field('notes') notes: string | null = null;
  @field('parent_set_id') parentSetId: string | null = null;
  @readonly @date('created_at') createdAt = new Date();

  @relation('workout_sessions', 'workout_session_id') workoutSession: any;
  @relation('exercises', 'exercise_id') exercise: any;
}
