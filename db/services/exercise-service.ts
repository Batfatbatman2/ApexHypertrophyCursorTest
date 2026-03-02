import { Q } from '@nozbe/watermelondb';
import { BaseService, dbWrite } from './base-service';
import { database } from '../database';
import Exercise from '../models/Exercise';
import { EXERCISE_LIBRARY, type ExerciseSeed } from '@/constants/exercises';

interface ExerciseData {
  name: string;
  muscleGroups: string[];
  equipment: string;
  movementPattern: string;
  isCompound: boolean;
  sfrRating: number;
  cues?: string;
  isCustom?: boolean;
  userId?: string;
  status?: string;
  isBlacklisted?: boolean;
  painRate?: number;
}

export class ExerciseService extends BaseService<Exercise> {
  constructor() {
    super('exercises');
  }

  async findByName(name: string): Promise<Exercise | null> {
    const results = await this.collection.query(Q.where('name', name)).fetch();
    return results[0] || null;
  }

  async findByNames(names: string[]): Promise<Exercise[]> {
    return this.collection.query(Q.where('name', Q.oneOf(names))).fetch();
  }

  async findByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return this.collection.query(Q.where('muscle_groups', Q.like(`%${muscleGroup}%`))).fetch();
  }

  async findByEquipment(equipment: string): Promise<Exercise[]> {
    return this.collection.query(Q.where('equipment', equipment)).fetch();
  }

  async findCustomExercises(userId: string): Promise<Exercise[]> {
    return this.collection.query(Q.where('user_id', userId), Q.where('is_custom', true)).fetch();
  }

  async findBlacklisted(userId: string): Promise<Exercise[]> {
    return this.collection
      .query(Q.where('user_id', userId), Q.where('is_blacklisted', true))
      .fetch();
  }

  async createExercise(data: ExerciseData): Promise<Exercise> {
    return dbWrite(async () => {
      return this.collection.create((exercise: any) => {
        exercise.name = data.name;
        exercise.muscleGroups = data.muscleGroups;
        exercise.equipment = data.equipment;
        exercise.movementPattern = data.movementPattern;
        exercise.isCompound = data.isCompound;
        exercise.sfrRating = data.sfrRating;
        exercise.cues = data.cues || null;
        exercise.isCustom = data.isCustom ?? false;
        exercise.userId = data.userId || null;
        exercise.status = data.status || 'experimental';
        exercise.isBlacklisted = data.isBlacklisted ?? false;
        exercise.painRate = data.painRate ?? 0;
      });
    });
  }

  async createCustomExercise(
    userId: string,
    data: Omit<ExerciseData, 'isCustom' | 'userId' | 'status'>,
  ): Promise<Exercise> {
    return this.createExercise({
      ...data,
      isCustom: true,
      userId,
      status: 'experimental',
    });
  }

  async updateExerciseStatus(
    id: string,
    status: 'proven' | 'experimental' | 'blacklisted',
  ): Promise<Exercise | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((exercise: any) => {
        exercise.status = status;
        exercise.isBlacklisted = status === 'blacklisted';
      });
      return record;
    });
  }

  async updatePainRate(id: string, painRate: number): Promise<Exercise | null> {
    const record = await this.findById(id);
    if (!record) return null;

    return dbWrite(async () => {
      await record.update((exercise: any) => {
        exercise.painRate = painRate;
        // Auto-blacklist if pain rate > 30%
        if (painRate > 30) {
          exercise.isBlacklisted = true;
          exercise.status = 'blacklisted';
        }
      });
      return record;
    });
  }

  async seedDefaultExercises(): Promise<number> {
    const existingCount = await this.collection.query().fetchCount();

    // Only seed if database is empty
    if (existingCount > 0) {
      console.log(
        `[ExerciseService] Database already has ${existingCount} exercises, skipping seed`,
      );
      return 0;
    }

    console.log(`[ExerciseService] Seeding ${EXERCISE_LIBRARY.length} exercises...`);

    const exercisesToCreate: Partial<Exercise>[] = EXERCISE_LIBRARY.map(
      (seed: ExerciseSeed) =>
        ({
          name: seed.name,
          muscleGroups: seed.muscleGroups,
          equipment: seed.equipment,
          movementPattern: seed.movementPattern,
          isCompound: seed.isCompound,
          sfrRating: seed.sfrRating,
          cues: seed.cues || null,
          isCustom: false,
          userId: null,
          status: 'experimental',
          isBlacklisted: false,
          painRate: 0,
        }) as any,
    );

    await dbWrite(async () => {
      await database.batch(
        ...exercisesToCreate.map((data) =>
          this.collection.prepareCreate((exercise: any) => {
            exercise.name = data.name!;
            exercise.muscleGroups = data.muscleGroups!;
            exercise.equipment = data.equipment!;
            exercise.movementPattern = data.movementPattern!;
            exercise.isCompound = data.isCompound!;
            exercise.sfrRating = data.sfrRating!;
            exercise.cues = data.cues || null;
            exercise.isCustom = data.isCustom ?? false;
            exercise.userId = data.userId || null;
            exercise.status = data.status || 'experimental';
            exercise.isBlacklisted = data.isBlacklisted ?? false;
            exercise.painRate = data.painRate ?? 0;
          }),
        ),
      );
    });

    console.log(`[ExerciseService] Successfully seeded ${EXERCISE_LIBRARY.length} exercises`);
    return EXERCISE_LIBRARY.length;
  }

  getEquipmentList(): string[] {
    const equipment = new Set<string>();
    EXERCISE_LIBRARY.forEach((ex) => equipment.add(ex.equipment));
    return Array.from(equipment).sort();
  }

  getMuscleGroupsList(): string[] {
    const muscleGroups = new Set<string>();
    EXERCISE_LIBRARY.forEach((ex) => ex.muscleGroups.forEach((mg) => muscleGroups.add(mg)));
    return Array.from(muscleGroups).sort();
  }
}

export const exerciseService = new ExerciseService();
