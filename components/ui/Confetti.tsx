import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ConfettiPiece = {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
};

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
  particleCount?: number;
}

const CONFETTI_COLORS = [
  Colors.accent, // Red
  '#FFD700', // Gold
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

function Particle({ piece, visible }: { piece: ConfettiPiece; visible: boolean }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      progress.value = withDelay(
        piece.delay,
        withTiming(1, {
          duration: 3000,
          easing: Easing.out(Easing.quad),
        }),
      );
      opacity.value = withDelay(piece.delay + 2000, withTiming(0, { duration: 1000 }));
    } else {
      progress.value = 0;
      opacity.value = 1;
    }
  }, [visible, piece.delay, progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 1], [-50, SCREEN_HEIGHT + 50]);
    const x = interpolate(
      progress.value,
      [0, 0.2, 0.5, 0.8, 1],
      [piece.x, piece.x - 30, piece.x + 30, piece.x - 20, piece.x],
    );
    const rotate = interpolate(progress.value, [0, 1], [0, piece.rotation]);

    return {
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${rotate}deg` }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: piece.size,
          height: piece.size * 0.6,
          backgroundColor: piece.color,
          borderRadius: piece.size > 6 ? 2 : 1,
        },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({ visible, onComplete, particleCount = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (visible) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 10 + 4,
          delay: Math.random() * 500,
          rotation: Math.random() * 720 - 360,
        });
      }
      setPieces(newPieces);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete, particleCount]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.container} pointerEvents="none">
        {pieces.map((piece) => (
          <Particle key={piece.id} piece={piece} visible={visible} />
        ))}
      </View>
    </Modal>
  );
}

// Confetti burst for PR celebrations
interface PRConfettiProps {
  isVisible: boolean;
  prType?: 'weight' | 'reps' | 'volume';
  onComplete?: () => void;
}

export function PRConfetti({ isVisible, prType, onComplete }: PRConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
    }
  }, [isVisible]);

  const handleComplete = () => {
    setShowConfetti(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Confetti
      visible={showConfetti}
      onComplete={handleComplete}
      particleCount={prType === 'weight' ? 80 : 40}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
});
