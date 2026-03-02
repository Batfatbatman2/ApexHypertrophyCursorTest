import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class PersonalRecord extends Model {
  static table = 'personal_records';

  static associations = {
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('exercise_id') exerciseId = '';
  @field('user_id') userId = '';
  @field('pr_type') prType = '';
  @field('value') value = 0;
  @field('weight') weight: number | null = null;
  @field('reps') reps: number | null = null;
  @field('session_id') sessionId: string | null = null;
  @date('achieved_at') achievedAt = new Date();

  @relation('exercises', 'exercise_id') exercise: any;
}
