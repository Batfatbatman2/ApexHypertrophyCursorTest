import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '@/constants/Colors';

interface ProgressRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  current,
  target,
  size = 68,
  strokeWidth = 4,
  color = Colors.accent,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.surfaceBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          {progress > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>
        <View style={styles.innerText}>
          <Text style={styles.value}>
            {current}/{target}
          </Text>
        </View>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  innerText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
