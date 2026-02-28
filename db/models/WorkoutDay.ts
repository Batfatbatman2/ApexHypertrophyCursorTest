import { Model } from '@nozbe/watermelondb';
import { field, children, relation } from '@nozbe/watermelondb/decorators';

export default class WorkoutDay extends Model {
  static table = 'workout_days';

  static associations = {
    programs: { type: 'belongs_to' as const, key: 'program_id' },
    program_exercises: { type: 'has_many' as const, foreignKey: 'workout_day_id' },
  };

  @field('program_id') programId = '';
  @field('day_number') dayNumber = 0;
  @field('name') name = '';
  @field('is_rest_day') isRestDay = false;
  @field('estimated_duration') estimatedDuration: number | null = null;

  @relation('programs', 'program_id') program: any;
  @children('program_exercises') programExercises: any;
}
