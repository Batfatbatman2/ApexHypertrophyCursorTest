// Database stub for web environment - WatermelonDB decorators don't work with Metro bundler
// This stub provides basic functionality without importing the actual models

// Mock database interface for web
export const database = {
  get: (table: string) => ({
    query: () => ({
      fetch: async () => [],
      fetchCount: async () => 0,
    }),
    find: async (id: string) => null,
    create: async (data: any) => ({ id: 'mock-id', ...data }),
  }),
  write: async (fn: () => any) => fn(),
} as any;

// Re-export initializeDatabase for compatibility
export interface SeedResult {
  exercises: number;
  success: boolean;
  error?: string;
}

export async function initializeDatabase(): Promise<SeedResult> {
  console.log('[Database] Web stub - skipping initialization');
  return { exercises: 0, success: true };
}

export async function isDatabaseInitialized(): Promise<boolean> {
  return false;
}

export async function clearDatabase(): Promise<void> {
  console.log('[Database] Web stub - clear not implemented');
}
