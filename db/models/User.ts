import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

const sanitizeStringArray = (raw: unknown) => (Array.isArray(raw) ? raw : []);

export default class User extends Model {
  static table = 'users';

  @field('remote_id') remoteId: string | null = null;
  @field('email') email = '';
  @field('name') name = '';
  @field('training_age') trainingAge = '';
  @field('goal') goal = '';
  @field('equipment') equipment = '';
  @field('age') age: number | null = null;
  @field('gender') gender: string | null = null;
  @field('bodyweight') bodyweight: number | null = null;
  @field('weight_unit') weightUnit = 'lbs';
  @field('training_days_per_week') trainingDaysPerWeek = 3;
  @json('injuries', sanitizeStringArray) injuries: string[] = [];
  @readonly @date('created_at') createdAt = new Date();
  @date('updated_at') updatedAt = new Date();
}
