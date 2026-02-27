import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  Colors.accent,
  Colors.success,
  Colors.warmup,
  Colors.myoRep,
  Colors.dropSet,
  '#FFD700',
  '#FF69B4',
  '#00FF88',
];

const PARTICLE_COUNT = 50;
const DURATION = 2400;

interface ConfettiParticleProps {
  index: number;
  onFinish?: () => void;
  isLast: boolean;
}

function ConfettiParticle({ index, onFinish, isLast }: ConfettiParticleProps) {
  const progress = useSharedValue(0);
  const startX = useMemo(() => Math.random() * SCREEN_W, []);
  const endX = useMemo(() => startX + (Math.random() - 0.5) * 200, [startX]);
  const size = useMemo(() => 6 + Math.random() * 8, []);
  const color = useMemo(() => CONFETTI_COLORS[index % CONFETTI_COLORS.length], [index]);
  const rotationEnd = useMemo(() => (Math.random() - 0.5) * 720, []);
  const delay = useMemo(() => Math.random() * 600, []);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(
        1,
        { duration: DURATION, easing: Easing.out(Easing.quad) },
        isLast && onFinish ? () => runOnJS(onFinish)() : undefined,
      ),
    );
  }, [progress, delay, isLast, onFinish]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: startX + (endX - startX) * p },
        { translateY: -60 + SCREEN_H * 1.1 * p },
        { rotate: `${rotationEnd * p}deg` },
      ],
      opacity: p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size * 0.6, backgroundColor: color, borderRadius: size / 4 },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
  useEffect(() => {
    if (visible) {
      haptics.success();
      setTimeout(() => haptics.heavy(), 200);
      setTimeout(() => haptics.medium(), 500);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <ConfettiParticle
          key={i}
          index={i}
          isLast={i === PARTICLE_COUNT - 1}
          onFinish={onComplete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
