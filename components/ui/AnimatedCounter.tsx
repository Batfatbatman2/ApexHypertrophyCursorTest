import React from 'react';
import { Text, type TextStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
}

export function AnimatedCounter({ value, style }: AnimatedCounterProps) {
  return <Text style={[defaultStyle, style]}>{value}</Text>;
}

const defaultStyle: TextStyle = {
  color: Colors.accent,
  fontSize: 28,
  fontWeight: '800',
};
