import { Q } from '@nozbe/watermelondb';
import { BaseService, dbWrite } from './base-service';
import ReadinessSurvey from '../models/ReadinessSurvey';

interface ReadinessData {
  userId: string;
  soreness: number; // 1-5
  sleepQuality: number; // 1-5
  stressLevel: number; // 1-5
  energyLevel: number; // 1-5
  notes?: string;
  surveyedAt?: Date;
}

function calculateReadinessScore(
  soreness: number,
  sleepQuality: number,
  stressLevel: number,
  energyLevel: number,
): number {
  // Formula: ((5 - soreness + sleepQuality + (5 - stressLevel) + energyLevel) / 20) * 100
  return Math.round(((5 - soreness + sleepQuality + (5 - stressLevel) + energyLevel) / 20) * 100);
}

export class ReadinessService extends BaseService<ReadinessSurvey> {
  constructor() {
    super('readiness_surveys');
  }

  async findByUser(userId: string, limit = 30): Promise<ReadinessSurvey[]> {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('surveyed_at', Q.desc), Q.take(limit))
      .fetch();
  }

  async findToday(userId: string): Promise<ReadinessSurvey | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await this.collection
      .query(
        Q.where('user_id', userId),
        Q.where('surveyed_at', Q.gte(today.getTime())),
        Q.where('surveyed_at', Q.lt(tomorrow.getTime())),
      )
      .fetch();

    return results[0] || null;
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReadinessSurvey[]> {
    return this.collection
      .query(
        Q.where('user_id', userId),
        Q.where('surveyed_at', Q.gte(startDate.getTime())),
        Q.where('surveyed_at', Q.lte(endDate.getTime())),
        Q.sortBy('surveyed_at', Q.desc),
      )
      .fetch();
  }

  async createSurvey(data: ReadinessData): Promise<ReadinessSurvey> {
    const score = calculateReadinessScore(
      data.soreness,
      data.sleepQuality,
      data.stressLevel,
      data.energyLevel,
    );

    return dbWrite(async () => {
      return this.collection.create((survey: any) => {
        survey.userId = data.userId;
        survey.soreness = data.soreness;
        survey.sleepQuality = data.sleepQuality;
        survey.stressLevel = data.stressLevel;
        survey.energyLevel = data.energyLevel;
        survey.score = score;
        survey.notes = data.notes || null;
        survey.surveyedAt = data.surveyedAt || new Date();
      });
    });
  }

  async getAverageScore(userId: string, days = 7): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const surveys = await this.findByDateRange(userId, startDate, new Date());

    if (surveys.length === 0) return 0;

    const totalScore = surveys.reduce((sum, s) => sum + (s as any).score, 0);
    return Math.round(totalScore / surveys.length);
  }

  async getLatestEntries(userId: string, count = 7): Promise<ReadinessSurvey[]> {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('surveyed_at', Q.desc), Q.take(count))
      .fetch();
  }

  observeByUser(userId: string) {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('surveyed_at', Q.desc))
      .observe();
  }

  observeToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.collection
      .query(
        Q.where('user_id', userId),
        Q.where('surveyed_at', Q.gte(today.getTime())),
        Q.where('surveyed_at', Q.lt(tomorrow.getTime())),
      )
      .observe();
  }
}

export const readinessService = new ReadinessService();
