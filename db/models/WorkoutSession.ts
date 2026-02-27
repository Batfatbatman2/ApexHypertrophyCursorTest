import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';

export default class WorkoutSession extends Model {
  static table = 'workout_sessions';

  static associations = {
    programs: { type: 'belongs_to' as const, key: 'program_id' },
    set_logs: { type: 'has_many' as const, foreignKey: 'workout_session_id' },
  };

  @field('program_id') programId!: string | null;
  @field('workout_day_id') workoutDayId!: string | null;
  @field('user_id') userId!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date | null;
  @field('status') status!: string;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;

  @relation('programs', 'program_id') program: any;
  @children('set_logs') setLogs: any;
}
