import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
}

export function GlassmorphicCard({
  children,
  style,
  intensity = 40,
  tint = 'dark',
}: GlassmorphicCardProps) {
  const blurIntensity = Math.round(intensity * 1.5);

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={blurIntensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    padding: 20,
    zIndex: 1,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
});
