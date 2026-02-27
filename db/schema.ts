import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const SCHEMA_VERSION = 1;

export const schema = appSchema({
  version: SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'remote_id', type: 'string', isOptional: true },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'training_age', type: 'string' },
        { name: 'goal', type: 'string' },
        { name: 'equipment', type: 'string' },
        { name: 'age', type: 'number', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'bodyweight', type: 'number', isOptional: true },
        { name: 'weight_unit', type: 'string' },
        { name: 'training_days_per_week', type: 'number' },
        { name: 'injuries', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'programs',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'goal', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'schedule_type', type: 'string' },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'workout_days',
      columns: [
        { name: 'program_id', type: 'string', isIndexed: true },
        { name: 'day_number', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'is_rest_day', type: 'boolean' },
        { name: 'estimated_duration', type: 'number', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'program_exercises',
      columns: [
        { name: 'workout_day_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order_index', type: 'number' },
        { name: 'sets', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'set_type', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'muscle_groups', type: 'string' },
        { name: 'equipment', type: 'string' },
        { name: 'movement_pattern', type: 'string' },
        { name: 'is_compound', type: 'boolean' },
        { name: 'sfr_rating', type: 'number' },
        { name: 'cues', type: 'string', isOptional: true },
        { name: 'is_custom', type: 'boolean' },
        { name: 'status', type: 'string' },
        { name: 'user_id', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'program_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'workout_day_id', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'set_logs',
      columns: [
        { name: 'workout_session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'set_number', type: 'number' },
        { name: 'set_type', type: 'string' },
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'muscle_connection', type: 'number', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'parent_set_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'personal_records',
      columns: [
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'pr_type', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'weight', type: 'number', isOptional: true },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'session_id', type: 'string', isOptional: true },
        { name: 'achieved_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'readiness_surveys',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'soreness', type: 'number' },
        { name: 'sleep_quality', type: 'number' },
        { name: 'stress_level', type: 'number' },
        { name: 'energy_level', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'surveyed_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'ai_profiles',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'mev_per_muscle', type: 'string' },
        { name: 'mrv_per_muscle', type: 'string' },
        { name: 'optimal_volume_zone', type: 'string' },
        { name: 'volume_sensitivity', type: 'number' },
        { name: 'recovery_hours', type: 'number' },
        { name: 'stress_multiplier', type: 'number' },
        { name: 'fatigue_index', type: 'number' },
        { name: 'learning_phase', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
