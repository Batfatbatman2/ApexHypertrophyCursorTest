import { StyleSheet } from 'react-native';

/**
 * Minimum touch target size (44pt as per Apple HIG)
 */
export const MIN_TOUCH_SIZE = 44;

/**
 * Touch target utility for ensuring accessibility
 */
export const touchTargetStyles = StyleSheet.create({
  // Minimum touch target
  minimum: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
  },

  // Comfortable touch target
  comfortable: {
    minWidth: MIN_TOUCH_SIZE * 1.5,
    minHeight: MIN_TOUCH_SIZE * 1.5,
  },

  // Large touch target for primary actions
  large: {
    minWidth: MIN_TOUCH_SIZE * 2,
    minHeight: MIN_TOUCH_SIZE * 1.5,
  },

  // Icon button (circular)
  iconButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Row item with touch target
  rowItem: {
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

/**
 * Validates if a component meets touch target requirements
 */
export function validateTouchTarget(
  width: number | undefined,
  height: number | undefined,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (width !== undefined && width < MIN_TOUCH_SIZE) {
    issues.push(`Width (${width}pt) is below minimum ${MIN_TOUCH_SIZE}pt`);
  }

  if (height !== undefined && height < MIN_TOUCH_SIZE) {
    issues.push(`Height (${height}pt) is below minimum ${MIN_TOUCH_SIZE}pt`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Accessibility helper props
 */
export const a11yProps = (
  label: string,
  hint?: string,
  role: 'button' | 'link' | 'image' | 'checkbox' = 'button',
) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: role,
});

/**
 * Common a11y labels
 */
export const a11yLabels = {
  // Navigation
  homeTab: 'Home tab',
  programTab: 'Program tab',
  analyticsTab: 'Analytics tab',
  settingsTab: 'Settings tab',

  // Actions
  startWorkout: 'Start workout button',
  logReadiness: 'Log daily readiness',
  viewPRs: 'View personal records',

  // Controls
  increase: 'Increase value',
  decrease: 'Decrease value',
  toggle: 'Toggle setting',
  close: 'Close',
  back: 'Go back',

  // Feedback
  loading: 'Loading content',
  error: 'Error occurred',
  success: 'Operation successful',
};
