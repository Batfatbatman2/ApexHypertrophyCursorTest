import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassmorphicCard({ children, style, intensity = 40 }: GlassmorphicCardProps) {
  return (
    <View style={[styles.container, { opacity: 0.05 + intensity / 100 }, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inner: {
    padding: 20,
  },
});
