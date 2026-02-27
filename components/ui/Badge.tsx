import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

export type BadgeVariant = 'accent' | 'success' | 'warning' | 'error' | 'muted' | 'custom';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: string;
  size?: 'sm' | 'md';
}

const VARIANT_MAP: Record<Exclude<BadgeVariant, 'custom'>, { bg: string; text: string }> = {
  accent: { bg: 'rgba(255, 45, 45, 0.15)', text: Colors.accent },
  success: { bg: 'rgba(34, 197, 94, 0.15)', text: Colors.success },
  warning: { bg: 'rgba(250, 204, 21, 0.15)', text: Colors.warning },
  error: { bg: Colors.accent, text: '#FFFFFF' },
  muted: { bg: Colors.surfaceLight, text: Colors.textSecondary },
};

export function Badge({ label, variant = 'accent', color, size = 'sm' }: BadgeProps) {
  let bg: string;
  let textColor: string;

  if (variant === 'custom' && color) {
    bg = color + '22';
    textColor = color;
  } else if (variant !== 'custom') {
    bg = VARIANT_MAP[variant].bg;
    textColor = VARIANT_MAP[variant].text;
  } else {
    bg = VARIANT_MAP.muted.bg;
    textColor = VARIANT_MAP.muted.text;
  }

  const sizeStyle: { container: ViewStyle; text: TextStyle } =
    size === 'sm'
      ? {
          container: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
          text: { fontSize: 10, fontWeight: '700' },
        }
      : {
          container: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
          text: { fontSize: 11, fontWeight: '700' },
        };

  return (
    <View style={[styles.base, sizeStyle.container, { backgroundColor: bg }]}>
      <Text style={[styles.baseText, sizeStyle.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
  baseText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
