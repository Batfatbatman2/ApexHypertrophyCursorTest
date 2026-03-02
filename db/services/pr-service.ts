import { Q } from '@nozbe/watermelondb';
import { BaseService, dbWrite } from './base-service';
import PersonalRecord from '../models/PersonalRecord';

export type PRType = 'weight' | 'reps' | 'volume';

interface PRData {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  prType: PRType;
  value: number;
  weight: number;
  reps: number;
  achievedAt?: Date;
}

export class PRService extends BaseService<PersonalRecord> {
  constructor() {
    super('personal_records');
  }

  async findByUser(userId: string): Promise<PersonalRecord[]> {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('achieved_at', Q.desc))
      .fetch();
  }

  async findByExercise(exerciseId: string): Promise<PersonalRecord[]> {
    return this.collection
      .query(Q.where('exercise_id', exerciseId), Q.sortBy('achieved_at', Q.desc))
      .fetch();
  }

  async findByExerciseAndType(exerciseId: string, prType: PRType): Promise<PersonalRecord | null> {
    const results = await this.collection
      .query(Q.where('exercise_id', exerciseId), Q.where('pr_type', prType))
      .fetch();
    return results[0] || null;
  }

  async getCurrentPRs(exerciseId: string): Promise<{
    weightPR: PersonalRecord | null;
    repsPR: PersonalRecord | null;
    volumePR: PersonalRecord | null;
  }> {
    const allPRs = await this.findByExercise(exerciseId);

    let weightPR: PersonalRecord | null = null;
    let repsPR: PersonalRecord | null = null;
    let volumePR: PersonalRecord | null = null;

    for (const pr of allPRs) {
      if (pr.prType === 'weight' && (!weightPR || pr.value > weightPR.value)) {
        weightPR = pr;
      }
      if (pr.prType === 'reps' && (!repsPR || pr.value > repsPR.value)) {
        repsPR = pr;
      }
      if (pr.prType === 'volume' && (!volumePR || pr.value > volumePR.value)) {
        volumePR = pr;
      }
    }

    return { weightPR, repsPR, volumePR };
  }

  async checkAndUpdatePR(data: {
    userId: string;
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
  }): Promise<{ isNewPR: boolean; prTypes: PRType[] }> {
    const { weight, reps } = data;
    if (weight <= 0 || reps <= 0) {
      return { isNewPR: false, prTypes: [] };
    }

    const volume = weight * reps;
    const prTypes: PRType[] = [];

    // Check weight PR
    const currentWeightPR = await this.findByExerciseAndType(data.exerciseId, 'weight');
    if (!currentWeightPR || weight > currentWeightPR.value) {
      prTypes.push('weight');
      await this.createPR({
        ...data,
        prType: 'weight',
        value: weight,
      });
    }

    // Check reps PR
    const currentRepsPR = await this.findByExerciseAndType(data.exerciseId, 'reps');
    if (!currentRepsPR || reps > currentRepsPR.value) {
      prTypes.push('reps');
      await this.createPR({
        ...data,
        prType: 'reps',
        value: reps,
      });
    }

    // Check volume PR
    const currentVolumePR = await this.findByExerciseAndType(data.exerciseId, 'volume');
    if (!currentVolumePR || volume > currentVolumePR.value) {
      prTypes.push('volume');
      await this.createPR({
        ...data,
        prType: 'volume',
        value: volume,
      });
    }

    return { isNewPR: prTypes.length > 0, prTypes };
  }

  async createPR(data: PRData): Promise<PersonalRecord> {
    return dbWrite(async () => {
      return this.collection.create((pr: any) => {
        pr.userId = data.userId;
        pr.exerciseId = data.exerciseId;
        pr.exerciseName = data.exerciseName;
        pr.prType = data.prType;
        pr.value = data.value;
        pr.weight = data.weight;
        pr.reps = data.reps;
        pr.achievedAt = data.achievedAt || new Date();
      });
    });
  }

  async deletePR(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async getTotalPRCount(userId: string): Promise<number> {
    return this.collection.query(Q.where('user_id', userId)).fetchCount();
  }

  observeByUser(userId: string) {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('achieved_at', Q.desc))
      .observe();
  }

  observeByExercise(exerciseId: string) {
    return this.collection
      .query(Q.where('exercise_id', exerciseId), Q.sortBy('achieved_at', Q.desc))
      .observe();
  }
}

export const prService = new PRService();
