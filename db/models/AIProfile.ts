import { Model } from '@nozbe/watermelondb';
import { field, date, json } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (raw: unknown) => (typeof raw === 'object' && raw !== null ? raw : {});

export default class AIProfile extends Model {
  static table = 'ai_profiles';

  @field('user_id') userId = '';
  @json('mev_per_muscle', sanitizeJson) mevPerMuscle: Record<string, number> = {};
  @json('mrv_per_muscle', sanitizeJson) mrvPerMuscle: Record<string, number> = {};
  @json('optimal_volume_zone', sanitizeJson) optimalVolumeZone: Record<string, [number, number]> = {};
  @field('volume_sensitivity') volumeSensitivity = 0;
  @field('recovery_hours') recoveryHours = 48;
  @field('stress_multiplier') stressMultiplier = 1;
  @field('fatigue_index') fatigueIndex = 0;
  @field('learning_phase') learningPhase = 'initial';
  @date('updated_at') updatedAt = new Date();
}
