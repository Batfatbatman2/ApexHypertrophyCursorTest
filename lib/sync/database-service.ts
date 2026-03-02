import { database } from '@/db';
import { Q } from '@nozbe/watermelondb';

// Service to sync Zustand stores with WatermelonDB

// Personal Records
export const prDbService = {
  async getAll(userId: string = 'local-user') {
    try {
      const records = await database.get('personal_records').query(
        Q.where('user_id', userId)
      ).fetch();
      return records.map(r => ({
        id: r.id,
        exerciseId: (r as any).exerciseId,
        prType: (r as any).prType,
        value: (r as any).value,
        weight: (r as any).weight ?? 0,
        reps: (r as any).reps ?? 0,
        achievedAt: (r as any).achievedAt,
      }));
    } catch (e) {
      console.warn('PR getAll failed:', e);
      return [];
    }
  },

  async save(record: {
    exerciseId: string;
    prType: string;
    value: number;
    weight?: number;
    reps?: number;
    userId?: string;
  }) {
    try {
      await database.write(async () => {
        await database.get('personal_records').create((pr: any) => {
          pr.exerciseId = record.exerciseId;
          pr.userId = record.userId ?? 'local-user';
          pr.prType = record.prType;
          pr.value = record.value;
          pr.weight = record.weight ?? 0;
          pr.reps = record.reps ?? 0;
          pr.achievedAt = Date.now();
        });
      });
    } catch (e) {
      console.warn('PR save failed:', e);
    }
  },

  async deleteAll(userId: string = 'local-user') {
    try {
      await database.write(async () => {
        const records = await database.get('personal_records').query(
          Q.where('user_id', userId)
        ).fetch();
        for (const r of records) {
          await r.destroyPermanently();
        }
      });
    } catch (e) {
      console.warn('PR deleteAll failed:', e);
    }
  },
};

// Readiness Surveys
export const readinessDbService = {
  async getAll(userId: string = 'local-user') {
    try {
      const records = await database.get('readiness_surveys').query(
        Q.where('user_id', userId),
        Q.sortBy('surveyed_at', Q.desc)
      ).fetch();
      return records.map(r => ({
        id: r.id,
        soreness: (r as any).soreness,
        sleepQuality: (r as any).sleepQuality,
        stressLevel: (r as any).stressLevel,
        energyLevel: (r as any).energyLevel,
        notes: (r as any).notes ?? '',
        surveyedAt: (r as any).surveyedAt,
      }));
    } catch (e) {
      console.warn('Readiness getAll failed:', e);
      return [];
    }
  },

  async save(data: {
    soreness: number;
    sleepQuality: number;
    stressLevel: number;
    energyLevel: number;
    notes?: string;
    userId?: string;
  }) {
    try {
      await database.write(async () => {
        await database.get('readiness_surveys').create((survey: any) => {
          survey.userId = data.userId ?? 'local-user';
          survey.soreness = data.soreness;
          survey.sleepQuality = data.sleepQuality;
          survey.stressLevel = data.stressLevel;
          survey.energyLevel = data.energyLevel;
          survey.notes = data.notes ?? '';
          survey.surveyedAt = Date.now();
        });
      });
    } catch (e) {
      console.warn('Readiness save failed:', e);
    }
  },

  async deleteAll(userId: string = 'local-user') {
    try {
      await database.write(async () => {
        const records = await database.get('readiness_surveys').query(
          Q.where('user_id', userId)
        ).fetch();
        for (const r of records) {
          await r.destroyPermanently();
        }
      });
    } catch (e) {
      console.warn('Readiness deleteAll failed:', e);
    }
  },
};

// Workout Sessions
export const sessionDbService = {
  async getAll(userId: string = 'local-user') {
    try {
      const records = await database.get('workout_sessions').query(
        Q.where('user_id', userId),
        Q.sortBy('created_at', Q.desc)
      ).fetch();
      return records.map(r => ({
        id: r.id,
        programId: (r as any).programId,
        workoutDayId: (r as any).workoutDayId,
        startTime: (r as any).startTime,
        endTime: (r as any).endTime,
        status: (r as any).status,
        notes: (r as any).notes ?? '',
        createdAt: (r as any).createdAt,
      }));
    } catch (e) {
      console.warn('Session getAll failed:', e);
      return [];
    }
  },

  async create(data: {
    programId?: string;
    workoutDayId?: string;
    userId?: string;
    status?: string;
  }) {
    try {
      let id = '';
      await database.write(async () => {
        const session = await database.get('workout_sessions').create((s: any) => {
          s.programId = data.programId ?? null;
          s.workoutDayId = data.workoutDayId ?? null;
          s.userId = data.userId ?? 'local-user';
          s.startTime = Date.now();
          s.status = data.status ?? 'in_progress';
          s.createdAt = Date.now();
        });
        id = session.id;
      });
      return id;
    } catch (e) {
      console.warn('Session create failed:', e);
      return null;
    }
  },

  async update(id: string, data: {
    endTime?: number;
    status?: string;
    notes?: string;
  }) {
    try {
      await database.write(async () => {
        const session = await database.get('workout_sessions').find(id);
        await session.update((s: any) => {
          if (data.endTime !== undefined) s.endTime = data.endTime;
          if (data.status !== undefined) s.status = data.status;
          if (data.notes !== undefined) s.notes = data.notes;
        });
      });
    } catch (e) {
      console.warn('Session update failed:', e);
    }
  },

  async addSetLog(data: {
    sessionId: string;
    exerciseId: string;
    setNumber: number;
    setType: string;
    weight: number;
    reps: number;
    rpe?: number;
    muscleConnection?: number;
    isCompleted: boolean;
    notes?: string;
  }) {
    try {
      let id = '';
      await database.write(async () => {
        const log = await database.get('set_logs').create((l: any) => {
          l.workoutSessionId = data.sessionId;
          l.exerciseId = data.exerciseId;
          l.setNumber = data.setNumber;
          l.setType = data.setType;
          l.weight = data.weight;
          l.reps = data.reps;
          l.rpe = data.rpe ?? null;
          l.muscleConnection = data.muscleConnection ?? null;
          l.isCompleted = data.isCompleted;
          l.notes = data.notes ?? '';
          l.createdAt = Date.now();
        });
        id = log.id;
      });
      return id;
    } catch (e) {
      console.warn('Set log create failed:', e);
      return null;
    }
  },

  async getSetLogs(sessionId: string) {
    try {
      const logs = await database.get('set_logs').query(
        Q.where('workout_session_id', sessionId),
        Q.sortBy('created_at', Q.asc)
      ).fetch();
      return logs.map(l => ({
        id: l.id,
        exerciseId: (l as any).exerciseId,
        setNumber: (l as any).setNumber,
        setType: (l as any).setType,
        weight: (l as any).weight,
        reps: (l as any).reps,
        rpe: (l as any).rpe,
        muscleConnection: (l as any).muscleConnection,
        isCompleted: (l as any).isCompleted,
        notes: (l as any).notes ?? '',
      }));
    } catch (e) {
      console.warn('Set logs get failed:', e);
      return [];
    }
  },
};
