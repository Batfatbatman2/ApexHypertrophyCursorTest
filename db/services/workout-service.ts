import { Q } from '@nozbe/watermelondb';
import { BaseService, dbWrite } from './base-service';
import { database } from '../database';
import WorkoutSession from '../models/WorkoutSession';
import SetLog from '../models/SetLog';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completing' | 'completed';

interface WorkoutSessionData {
  userId: string;
  programId?: string;
  workoutDayId?: string;
  name: string;
  startTime?: Date;
  endTime?: Date;
  status?: SessionStatus;
  notes?: string;
}

interface SetLogData {
  workoutSessionId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  equipment: string;
  setNumber: number;
  setType: string;
  weight: number;
  reps: number;
  rpe?: number;
  muscleConnection?: number;
  isCompleted?: boolean;
  parentSetId?: string;
  notes?: string;
  isPR?: boolean;
  prType?: string;
  completedAt?: Date;
}

export class WorkoutSessionService extends BaseService<WorkoutSession> {
  constructor() {
    super('workout_sessions');
  }

  async findByUser(userId: string, limit = 50): Promise<WorkoutSession[]> {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('start_time', Q.desc), Q.take(limit))
      .fetch();
  }

  async findByProgram(programId: string): Promise<WorkoutSession[]> {
    return this.collection
      .query(Q.where('program_id', programId), Q.sortBy('start_time', Q.desc))
      .fetch();
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    return this.collection
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime())),
        Q.where('start_time', Q.lte(endDate.getTime())),
        Q.sortBy('start_time', Q.desc),
      )
      .fetch();
  }

  async findActiveSession(userId: string): Promise<WorkoutSession | null> {
    const results = await this.collection
      .query(Q.where('user_id', userId), Q.where('status', 'active'))
      .fetch();
    return results[0] || null;
  }

  async createSession(data: WorkoutSessionData): Promise<WorkoutSession> {
    return dbWrite(async () => {
      return this.collection.create((session: any) => {
        session.userId = data.userId;
        session.programId = data.programId || null;
        session.workoutDayId = data.workoutDayId || null;
        session.name = data.name;
        session.startTime = data.startTime || new Date();
        session.status = data.status || 'active';
        session.notes = data.notes || null;
      });
    });
  }

  async updateSession(
    id: string,
    data: Partial<Pick<WorkoutSessionData, 'name' | 'status' | 'notes' | 'endTime'>>,
  ): Promise<WorkoutSession | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((session: any) => {
        if (data.name !== undefined) session.name = data.name;
        if (data.status !== undefined) session.status = data.status;
        if (data.notes !== undefined) session.notes = data.notes;
        if (data.endTime !== undefined) session.endTime = data.endTime;
      });
      return record;
    });
  }

  async completeSession(id: string): Promise<WorkoutSession | null> {
    return this.updateSession(id, {
      status: 'completed',
      endTime: new Date(),
    });
  }

  async deleteSession(id: string): Promise<boolean> {
    const session = await this.findById(id);
    if (!session) return false;

    return dbWrite(async () => {
      // Delete all set logs for this session
      const setLogs = await database
        .get<SetLog>('set_logs')
        .query(Q.where('workout_session_id', id))
        .fetch();

      const ops = [
        ...setLogs.map((sl: any) => sl.prepareMarkAsDeleted()),
        session.prepareMarkAsDeleted(),
      ];

      await database.batch(...ops);
      return true;
    });
  }

  observeByUser(userId: string) {
    return this.collection
      .query(Q.where('user_id', userId), Q.sortBy('start_time', Q.desc))
      .observe();
  }

  observeActive(userId: string) {
    return this.collection.query(Q.where('user_id', userId), Q.where('status', 'active')).observe();
  }
}

export class SetLogService extends BaseService<SetLog> {
  constructor() {
    super('set_logs');
  }

  async findBySession(sessionId: string): Promise<SetLog[]> {
    return this.collection
      .query(Q.where('workout_session_id', sessionId), Q.sortBy('created_at', Q.asc))
      .fetch();
  }

  async findByExercise(exerciseId: string, limit = 100): Promise<SetLog[]> {
    return this.collection
      .query(Q.where('exercise_id', exerciseId), Q.sortBy('created_at', Q.desc), Q.take(limit))
      .fetch();
  }

  async findCompletedByExercise(exerciseId: string): Promise<SetLog[]> {
    return this.collection
      .query(
        Q.where('exercise_id', exerciseId),
        Q.where('is_completed', true),
        Q.sortBy('completed_at', Q.desc),
      )
      .fetch();
  }

  async createSetLog(data: SetLogData): Promise<SetLog> {
    return dbWrite(async () => {
      return this.collection.create((setLog: any) => {
        setLog.workoutSessionId = data.workoutSessionId;
        setLog.exerciseId = data.exerciseId;
        setLog.exerciseName = data.exerciseName;
        setLog.muscleGroups = JSON.stringify(data.muscleGroups);
        setLog.equipment = data.equipment;
        setLog.setNumber = data.setNumber;
        setLog.setType = data.setType;
        setLog.weight = data.weight;
        setLog.reps = data.reps;
        setLog.rpe = data.rpe ?? null;
        setLog.muscleConnection = data.muscleConnection ?? null;
        setLog.isCompleted = data.isCompleted ?? false;
        setLog.parentSetId = data.parentSetId ?? null;
        setLog.notes = data.notes ?? null;
        setLog.isPR = data.isPR ?? false;
        setLog.prType = data.prType ?? null;
        setLog.completedAt = data.completedAt ?? null;
      });
    });
  }

  async updateSetLog(
    id: string,
    data: Partial<
      Pick<
        SetLogData,
        | 'weight'
        | 'reps'
        | 'rpe'
        | 'muscleConnection'
        | 'isCompleted'
        | 'notes'
        | 'isPR'
        | 'prType'
        | 'completedAt'
      >
    >,
  ): Promise<SetLog | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((setLog: any) => {
        if (data.weight !== undefined) setLog.weight = data.weight;
        if (data.reps !== undefined) setLog.reps = data.reps;
        if (data.rpe !== undefined) setLog.rpe = data.rpe;
        if (data.muscleConnection !== undefined) setLog.muscleConnection = data.muscleConnection;
        if (data.isCompleted !== undefined) {
          setLog.isCompleted = data.isCompleted;
          if (data.isCompleted && !data.completedAt) {
            setLog.completedAt = new Date();
          }
        }
        if (data.notes !== undefined) setLog.notes = data.notes;
        if (data.isPR !== undefined) setLog.isPR = data.isPR;
        if (data.prType !== undefined) setLog.prType = data.prType;
        if (data.completedAt !== undefined) setLog.completedAt = data.completedAt;
      });
      return record;
    });
  }

  async completeSetLog(id: string, rpe?: number): Promise<SetLog | null> {
    return this.updateSetLog(id, {
      isCompleted: true,
      rpe: rpe ?? undefined,
      completedAt: new Date(),
    });
  }

  async deleteSetLog(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async getVolumeByMuscleGroup(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const sessions = await this.collection
      .query(
        Q.where('user_id', userId),
        Q.where('start_time', Q.gte(startDate.getTime())),
        Q.where('start_time', Q.lte(endDate.getTime())),
        Q.where('is_completed', true),
      )
      .fetch();

    const volumeByMuscle: Record<string, number> = {};

    for (const session of sessions) {
      const sessionSets = await this.findBySession(session.id);
      for (const setLog of sessionSets) {
        const muscleGroups = (setLog as any).muscleGroups;
        if (Array.isArray(muscleGroups)) {
          for (const muscle of muscleGroups) {
            volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + setLog.weight * setLog.reps;
          }
        }
      }
    }

    return volumeByMuscle;
  }

  observeBySession(sessionId: string) {
    return this.collection
      .query(Q.where('workout_session_id', sessionId), Q.sortBy('created_at', Q.asc))
      .observe();
  }
}

export const workoutSessionService = new WorkoutSessionService();
export const setLogService = new SetLogService();
