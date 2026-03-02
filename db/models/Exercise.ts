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

  @field('name') name = '';
  @json('muscle_groups', sanitizeStringArray) muscleGroups: string[] = [];
  @field('equipment') equipment = '';
  @field('movement_pattern') movementPattern = '';
  @field('is_compound') isCompound = false;
  @field('sfr_rating') sfrRating = 0;
  @field('cues') cues: string | null = null;
  @field('is_custom') isCustom = false;
  @field('status') status = 'active';
  @field('user_id') userId: string | null = null;
  @field('is_blacklisted') isBlacklisted = false;
  @field('pain_rate') painRate = 0;
}
