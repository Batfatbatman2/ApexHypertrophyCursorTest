import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ReadinessSurvey extends Model {
  static table = 'readiness_surveys';

  @field('user_id') userId!: string;
  @field('soreness') soreness!: number;
  @field('sleep_quality') sleepQuality!: number;
  @field('stress_level') stressLevel!: number;
  @field('energy_level') energyLevel!: number;
  @field('notes') notes!: string | null;
  @date('surveyed_at') surveyedAt!: Date;
}
