/**
 * Apex Hypertrophy Design System — Color Tokens
 *
 * Derived from mockup screenshots. The app is dark-mode-first with
 * a cinematic OLED-black background and red accent system.
 */

export const Colors = {
  // Core backgrounds
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#242424',
  surfaceBorder: '#2A2A2A',

  // Primary accent
  accent: '#FF2D2D',
  accentDark: '#CC2424',
  accentLight: '#FF4D4D',

  // Semantic
  success: '#22C55E',
  warning: '#FACC15',
  error: '#EF4444',

  // Set type colors (refined from design reference)
  warmup: '#FACC15',
  working: '#FF2D55',
  myoRep: '#3B82F6',
  dropSet: '#A78BFA',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textAccent: '#FF2D2D',

  // Tab bar
  tabActive: '#FF2D2D',
  tabInactive: '#6B7280',
  tabBarBackground: '#0A0A0A',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  glassBg: 'rgba(26, 26, 26, 0.8)',
  cardHighlightBorder: '#FF2D2D',
  divider: '#1F1F1F',
} as const;

export type ColorKey = keyof typeof Colors;
