import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

export type CardVariant = 'default' | 'highlighted' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, variant = 'default', style, padding = 20 }: CardProps) {
  return <View style={[styles.base, { padding }, variantStyles[variant], style]}>{children}</View>;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  highlighted: {
    borderWidth: 1.5,
    borderColor: Colors.cardHighlightBorder,
  },
  elevated: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
});
