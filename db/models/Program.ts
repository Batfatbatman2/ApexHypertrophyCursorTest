import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export default class Program extends Model {
  static table = 'programs';

  static associations = {
    workout_days: { type: 'has_many' as const, foreignKey: 'program_id' },
    workout_sessions: { type: 'has_many' as const, foreignKey: 'program_id' },
  };

  @field('name') name = '';
  @field('description') description: string | null = null;
  @field('goal') goal = '';
  @field('is_active') isActive = false;
  @field('schedule_type') scheduleType = '';
  @field('user_id') userId = '';
  @readonly @date('created_at') createdAt = new Date();
  @date('updated_at') updatedAt = new Date();

  @children('workout_days') workoutDays: any;
  @children('workout_sessions') workoutSessions: any;
}
