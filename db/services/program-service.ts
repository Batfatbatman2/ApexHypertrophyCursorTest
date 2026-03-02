import { Q } from '@nozbe/watermelondb';
import { BaseService, dbWrite } from './base-service';
import { database } from '../database';
import Program from '../models/Program';
import WorkoutDay from '../models/WorkoutDay';
import ProgramExercise from '../models/ProgramExercise';

export type ProgramGoal = 'hypertrophy' | 'strength' | 'endurance' | 'general';
export type ScheduleType = 'rolling' | 'fixed';

interface ProgramData {
  name: string;
  description?: string;
  goal: ProgramGoal;
  scheduleType: ScheduleType;
  isActive?: boolean;
  userId: string;
}

interface WorkoutDayData {
  programId: string;
  name: string;
  dayOrder: number;
  isRestDay?: boolean;
  estimatedDuration?: number;
}

interface ProgramExerciseData {
  workoutDayId: string;
  exerciseId: string;
  exerciseOrder: number;
  sets: number;
  reps: number;
  setType: string;
  restSeconds?: number;
  notes?: string;
}

export class ProgramService extends BaseService<Program> {
  constructor() {
    super('programs');
  }

  async findByUser(userId: string): Promise<Program[]> {
    return this.collection.query(Q.where('user_id', userId)).fetch();
  }

  async findActiveProgram(userId: string): Promise<Program | null> {
    const results = await this.collection
      .query(Q.where('user_id', userId), Q.where('is_active', true))
      .fetch();
    return results[0] || null;
  }

  async findByGoal(userId: string, goal: ProgramGoal): Promise<Program[]> {
    return this.collection.query(Q.where('user_id', userId), Q.where('goal', goal)).fetch();
  }

  async createProgram(data: ProgramData): Promise<Program> {
    return dbWrite(async () => {
      return this.collection.create((program: any) => {
        program.name = data.name;
        program.description = data.description || null;
        program.goal = data.goal;
        program.scheduleType = data.scheduleType;
        program.isActive = data.isActive ?? false;
        program.userId = data.userId;
      });
    });
  }

  async updateProgram(
    id: string,
    data: Partial<Pick<ProgramData, 'name' | 'description' | 'goal' | 'scheduleType' | 'isActive'>>,
  ): Promise<Program | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((program: any) => {
        if (data.name !== undefined) program.name = data.name;
        if (data.description !== undefined) program.description = data.description;
        if (data.goal !== undefined) program.goal = data.goal;
        if (data.scheduleType !== undefined) program.scheduleType = data.scheduleType;
        if (data.isActive !== undefined) program.isActive = data.isActive;
      });
      return record;
    });
  }

  async setActive(id: string, userId: string): Promise<void> {
    await dbWrite(async () => {
      // Deactivate all programs for this user
      const allPrograms = await this.collection.query(Q.where('user_id', userId)).fetch();
      const deactivateOps = allPrograms.map((p: any) =>
        p.prepareUpdate((program: any) => {
          program.isActive = false;
        }),
      );

      // Activate the selected program
      const targetProgram = await this.collection.find(id);
      const activateOp = targetProgram.prepareUpdate((program: any) => {
        program.isActive = true;
      });

      await database.batch(...deactivateOps, activateOp);
    });
  }

  async deleteProgram(id: string): Promise<boolean> {
    const program = await this.findById(id);
    if (!program) return false;

    return dbWrite(async () => {
      // Get all workout days for this program
      const workoutDays = await database
        .get<WorkoutDay>('workout_days')
        .query(Q.where('program_id', id))
        .fetch();

      // Get all program exercises for these workout days
      const dayIds = workoutDays.map((d: any) => d.id);
      let programExercises: any[] = [];
      if (dayIds.length > 0) {
        programExercises = await database
          .get<ProgramExercise>('program_exercises')
          .query(Q.where('workout_day_id', Q.oneOf(dayIds)))
          .fetch();
      }

      // Delete in order: program exercises -> workout days -> program
      const ops = [
        ...programExercises.map((pe: any) => pe.prepareMarkAsDeleted()),
        ...workoutDays.map((wd: any) => wd.prepareMarkAsDeleted()),
        program.prepareMarkAsDeleted(),
      ];

      await database.batch(...ops);
      return true;
    });
  }

  async duplicateProgram(id: string, newName: string): Promise<Program | null> {
    const original = await this.findById(id);
    if (!original) return null;

    return dbWrite(async () => {
      // Create new program
      const newProgram = await this.collection.create((program: any) => {
        program.name = newName;
        program.description = original.description;
        program.goal = original.goal;
        program.scheduleType = original.scheduleType;
        program.isActive = false;
        program.userId = (original as any).userId;
      });

      // Get original workout days
      const originalDays = await database
        .get<WorkoutDay>('workout_days')
        .query(Q.where('program_id', id))
        .fetch();

      // Duplicate each workout day with its exercises
      for (const day of originalDays) {
        const newDay = await database.get<WorkoutDay>('workout_days').create((wd: any) => {
          wd.programId = newProgram.id;
          wd.dayNumber = (day as any).dayNumber;
          wd.name = (day as any).name;
          wd.isRestDay = (day as any).isRestDay;
          wd.estimatedDuration = (day as any).estimatedDuration;
        });

        // Get exercises for this day
        const dayExercises = await database
          .get<ProgramExercise>('program_exercises')
          .query(Q.where('workout_day_id', day.id))
          .fetch();

        // Duplicate each exercise
        for (const ex of dayExercises) {
          await database.get<ProgramExercise>('program_exercises').create((pe: any) => {
            pe.workoutDayId = newDay.id;
            pe.exerciseId = (ex as any).exerciseId;
            pe.orderIndex = (ex as any).orderIndex;
            pe.sets = (ex as any).sets;
            pe.reps = (ex as any).reps;
            pe.setType = (ex as any).setType;
            pe.notes = (ex as any).notes;
          });
        }
      }

      return newProgram;
    });
  }

  observeByUser(userId: string) {
    return this.collection.query(Q.where('user_id', userId)).observe();
  }

  observeActive(userId: string) {
    return this.collection.query(Q.where('user_id', userId), Q.where('is_active', true)).observe();
  }
}

export class WorkoutDayService extends BaseService<WorkoutDay> {
  constructor() {
    super('workout_days');
  }

  async findByProgram(programId: string): Promise<WorkoutDay[]> {
    return this.collection
      .query(Q.where('program_id', programId), Q.sortBy('day_number', Q.asc))
      .fetch();
  }

  async createWorkoutDay(data: WorkoutDayData): Promise<WorkoutDay> {
    return dbWrite(async () => {
      return this.collection.create((day: any) => {
        day.programId = data.programId;
        day.name = data.name;
        day.dayNumber = data.dayOrder;
        day.isRestDay = data.isRestDay ?? false;
        day.estimatedDuration = data.estimatedDuration ?? null;
      });
    });
  }

  async updateWorkoutDay(
    id: string,
    data: Partial<Pick<WorkoutDayData, 'name' | 'dayOrder' | 'isRestDay' | 'estimatedDuration'>>,
  ): Promise<WorkoutDay | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((day: any) => {
        if (data.name !== undefined) day.name = data.name;
        if (data.dayOrder !== undefined) day.dayNumber = data.dayOrder;
        if (data.isRestDay !== undefined) day.isRestDay = data.isRestDay;
        if (data.estimatedDuration !== undefined) day.estimatedDuration = data.estimatedDuration;
      });
      return record;
    });
  }

  async deleteWorkoutDay(id: string): Promise<boolean> {
    const day = await this.findById(id);
    if (!day) return false;

    return dbWrite(async () => {
      // Delete associated program exercises first
      const exercises = await database
        .get<ProgramExercise>('program_exercises')
        .query(Q.where('workout_day_id', id))
        .fetch();

      const ops = [
        ...exercises.map((e: any) => e.prepareMarkAsDeleted()),
        day.prepareMarkAsDeleted(),
      ];

      await database.batch(...ops);
      return true;
    });
  }

  observeByProgram(programId: string) {
    return this.collection
      .query(Q.where('program_id', programId), Q.sortBy('day_number', Q.asc))
      .observe();
  }
}

export class ProgramExerciseService extends BaseService<ProgramExercise> {
  constructor() {
    super('program_exercises');
  }

  async findByWorkoutDay(workoutDayId: string): Promise<ProgramExercise[]> {
    return this.collection
      .query(Q.where('workout_day_id', workoutDayId), Q.sortBy('order_index', Q.asc))
      .fetch();
  }

  async findByExercise(exerciseId: string): Promise<ProgramExercise[]> {
    return this.collection.query(Q.where('exercise_id', exerciseId)).fetch();
  }

  async createProgramExercise(data: ProgramExerciseData): Promise<ProgramExercise> {
    return dbWrite(async () => {
      return this.collection.create((pe: any) => {
        pe.workoutDayId = data.workoutDayId;
        pe.exerciseId = data.exerciseId;
        pe.orderIndex = data.exerciseOrder;
        pe.sets = data.sets;
        pe.reps = data.reps;
        pe.setType = data.setType;
        pe.restSeconds = data.restSeconds ?? null;
        pe.notes = data.notes ?? null;
      });
    });
  }

  async updateProgramExercise(
    id: string,
    data: Partial<Pick<ProgramExerciseData, 'sets' | 'reps' | 'setType' | 'restSeconds' | 'notes'>>,
  ): Promise<ProgramExercise | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((pe: any) => {
        if (data.sets !== undefined) pe.sets = data.sets;
        if (data.reps !== undefined) pe.reps = data.reps;
        if (data.setType !== undefined) pe.setType = data.setType;
        if (data.restSeconds !== undefined) pe.restSeconds = data.restSeconds;
        if (data.notes !== undefined) pe.notes = data.notes;
      });
      return record;
    });
  }

  async reorderExercises(workoutDayId: string, exerciseIds: string[]): Promise<void> {
    await dbWrite(async () => {
      const exercises = await this.collection
        .query(Q.where('workout_day_id', workoutDayId))
        .fetch();

      const ops = exercises.map((ex: any) =>
        ex.prepareUpdate((pe: any) => {
          const newOrder = exerciseIds.indexOf(ex.id);
          if (newOrder >= 0) {
            pe.orderIndex = newOrder;
          }
        }),
      );

      await database.batch(...ops);
    });
  }

  async deleteProgramExercise(id: string): Promise<boolean> {
    return this.delete(id);
  }

  observeByWorkoutDay(workoutDayId: string) {
    return this.collection
      .query(Q.where('workout_day_id', workoutDayId), Q.sortBy('order_index', Q.asc))
      .observe();
  }
}

export const programService = new ProgramService();
export const workoutDayService = new WorkoutDayService();
export const programExerciseService = new ProgramExerciseService();
