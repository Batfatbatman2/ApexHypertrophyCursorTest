import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

const sanitizeStringArray = (raw: unknown) => (Array.isArray(raw) ? raw : []);

export default class Exercise extends Model {
  static table = 'exercises';

  static associations = {
    program_exercises: { type: 'has_many' as const, foreignKey: 'exercise_id' },
    set_logs: { type: 'has_many' as const, foreignKey: 'exercise_id' },
    personal_records: { type: 'has_many' as const, foreignKey: 'exercise_id' },
  };

  @field('name') name!: string;
  @json('muscle_groups', sanitizeStringArray) muscleGroups!: string[];
  @field('equipment') equipment!: string;
  @field('movement_pattern') movementPattern!: string;
  @field('is_compound') isCompound!: boolean;
  @field('sfr_rating') sfrRating!: number;
  @field('cues') cues!: string | null;
  @field('is_custom') isCustom!: boolean;
  @field('status') status!: string;
  @field('user_id') userId!: string | null;
}
