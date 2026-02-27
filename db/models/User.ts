import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

const sanitizeStringArray = (raw: unknown) => (Array.isArray(raw) ? raw : []);

export default class User extends Model {
  static table = 'users';

  @field('remote_id') remoteId!: string | null;
  @field('email') email!: string;
  @field('name') name!: string;
  @field('training_age') trainingAge!: string;
  @field('goal') goal!: string;
  @field('equipment') equipment!: string;
  @field('age') age!: number | null;
  @field('gender') gender!: string | null;
  @field('bodyweight') bodyweight!: number | null;
  @field('weight_unit') weightUnit!: string;
  @field('training_days_per_week') trainingDaysPerWeek!: number;
  @json('injuries', sanitizeStringArray) injuries!: string[];
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
