import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export default class Program extends Model {
  static table = 'programs';

  static associations = {
    workout_days: { type: 'has_many' as const, foreignKey: 'program_id' },
    workout_sessions: { type: 'has_many' as const, foreignKey: 'program_id' },
  };

  @field('name') name!: string;
  @field('description') description!: string | null;
  @field('goal') goal!: string;
  @field('is_active') isActive!: boolean;
  @field('schedule_type') scheduleType!: string;
  @field('user_id') userId!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('workout_days') workoutDays: any;
  @children('workout_sessions') workoutSessions: any;
}
