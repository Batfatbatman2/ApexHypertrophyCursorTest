/**
 * WatermelonDB Schema — Apex Hypertrophy
 *
 * This defines the local SQLite schema for offline-first data.
 * Full model implementations will be added in Phase 3.
 */

export const TABLE_NAMES = {
  users: 'users',
  programs: 'programs',
  workoutDays: 'workout_days',
  programExercises: 'program_exercises',
  exercises: 'exercises',
  workoutSessions: 'workout_sessions',
  setLogs: 'set_logs',
  personalRecords: 'personal_records',
  readinessSurveys: 'readiness_surveys',
  aiProfiles: 'ai_profiles',
} as const;
