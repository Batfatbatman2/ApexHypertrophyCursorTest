import { database } from './database';
import { exerciseService } from './services/exercise-service';

export interface SeedResult {
  exercises: number;
  success: boolean;
  error?: string;
}

/**
 * Initialize the database and seed default data if needed
 */
export async function initializeDatabase(): Promise<SeedResult> {
  try {
    console.log('[Database] Starting initialization...');

    // Check if database is ready by performing a simple query
    await database.get('exercises').query().fetchCount();

    // Seed exercises
    const exerciseCount = await exerciseService.seedDefaultExercises();

    console.log('[Database] Initialization complete');
    return {
      exercises: exerciseCount,
      success: true,
    };
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    return {
      exercises: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if the database has been initialized (has data)
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const count = await database.get('exercises').query().fetchCount();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Clear all data from the database (for testing or reset)
 */
export async function clearDatabase(): Promise<void> {
  // Note: This requires iterating through each table
  // For LokiJS adapter, we need a different approach
  console.log('[Database] Clear not fully implemented for LokiJS adapter');
}

export { database };
