import { Model } from '@nozbe/watermelondb';
import { field, date, json } from '@nozbe/watermelondb/decorators';

const sanitizeJson = (raw: unknown) => (typeof raw === 'object' && raw !== null ? raw : {});

export default class AIProfile extends Model {
  static table = 'ai_profiles';

  @field('user_id') userId!: string;
  @json('mev_per_muscle', sanitizeJson) mevPerMuscle!: Record<string, number>;
  @json('mrv_per_muscle', sanitizeJson) mrvPerMuscle!: Record<string, number>;
  @json('optimal_volume_zone', sanitizeJson) optimalVolumeZone!: Record<string, [number, number]>;
  @field('volume_sensitivity') volumeSensitivity!: number;
  @field('recovery_hours') recoveryHours!: number;
  @field('stress_multiplier') stressMultiplier!: number;
  @field('fatigue_index') fatigueIndex!: number;
  @field('learning_phase') learningPhase!: string;
  @date('updated_at') updatedAt!: Date;
}
