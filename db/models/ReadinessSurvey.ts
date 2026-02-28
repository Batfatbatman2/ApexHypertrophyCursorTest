import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ReadinessSurvey extends Model {
  static table = 'readiness_surveys';

  @field('user_id') userId = '';
  @field('soreness') soreness = 0;
  @field('sleep_quality') sleepQuality = 0;
  @field('stress_level') stressLevel = 0;
  @field('energy_level') energyLevel = 0;
  @field('notes') notes: string | null = null;
  @date('surveyed_at') surveyedAt = new Date();
}
