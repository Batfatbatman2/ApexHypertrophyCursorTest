import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class PersonalRecord extends Model {
  static table = 'personal_records';

  static associations = {
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('exercise_id') exerciseId!: string;
  @field('user_id') userId!: string;
  @field('pr_type') prType!: string;
  @field('value') value!: number;
  @field('weight') weight!: number | null;
  @field('reps') reps!: number | null;
  @field('session_id') sessionId!: string | null;
  @date('achieved_at') achievedAt!: Date;

  @relation('exercises', 'exercise_id') exercise: any;
}
