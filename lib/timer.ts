/**
 * Timer utility functions
 * Extracted from timer-store.ts for reusability
 */

export interface TimerConfig {
  defaultDuration: number;
  autoStart: boolean;
  warningThresholds: number[]; // seconds remaining to trigger warning haptics
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  defaultDuration: 90, // 1.5 minutes
  autoStart: false,
  warningThresholds: [10, 5, 3, 2, 1], // countdown warnings
};

/**
 * Format seconds into MM:SS display string
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format seconds into a human-readable string (e.g., "1m 30s")
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Parse a duration string (e.g., "90", "1:30", "1m30s") into seconds
 */
export function parseDuration(input: string): number {
  // Handle "MM:SS" format
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return min * 60 + (sec || 0);
  }

  // Handle "Nm" or "Nms" format
  if (input.includes('m')) {
    const min = parseFloat(input.replace('m', ''));
    return Math.round(min * 60);
  }

  // Handle "Ns" format
  if (input.includes('s')) {
    return parseInt(input.replace('s', ''), 10);
  }

  // Plain number - treat as seconds
  return parseInt(input, 10) || 0;
}

/**
 * Calculate the percentage of time elapsed
 */
export function getProgress(remaining: number, total: number): number {
  if (total === 0) return 0;
  return ((total - remaining) / total) * 100;
}

/**
 * Get available preset durations in seconds
 */
export const PRESET_DURATIONS = [
  30,   // 30 seconds
  60,   // 1 minute
  90,   // 1.5 minutes
  120,  // 2 minutes
  180,  // 3 minutes
  240,  // 4 minutes
];

/**
 * Get preset duration label
 */
export function getPresetLabel(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const min = seconds / 60;
  return min === Math.floor(min) ? `${min}m` : `${min}m`;
}

/**
 * Determine if a threshold should trigger haptic feedback
 * Returns the haptic type to trigger, or null if no trigger
 */
export function getHapticForThreshold(
  currentSeconds: number,
  previousSeconds: number,
  thresholds: number[] = DEFAULT_TIMER_CONFIG.warningThresholds
): 'light' | 'medium' | 'heavy' | null {
  // Check if we crossed a threshold
  for (const threshold of thresholds) {
    if (previousSeconds > threshold && currentSeconds <= threshold) {
      if (threshold <= 3) return 'heavy';
      if (threshold <= 5) return 'medium';
      return 'light';
    }
  }
  return null;
}

/**
 * Calculate recommended rest time based on workout intensity
 */
export function calculateRecommendedRest(
  setsCompleted: number,
  rpe: number | null,
  isCompoundExercise: boolean
): number {
  let baseTime: number;

  // Base time depends on exercise type
  if (isCompoundExercise) {
    baseTime = 180; // 3 minutes for compounds
  } else {
    baseTime = 90; // 1.5 minutes for isolation
  }

  // Adjust for RPE (higher RPE = more rest needed)
  if (rpe !== null) {
    if (rpe >= 9) {
      baseTime += 60; // Extra minute for high intensity
    } else if (rpe >= 8) {
      baseTime += 30; // Extra 30 seconds
    }
  }

  // Adjust for accumulated fatigue (more sets = more rest)
  if (setsCompleted >= 3) {
    baseTime += 30;
  }

  return Math.min(baseTime, 300); // Cap at 5 minutes
}
