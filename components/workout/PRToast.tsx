import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';
import type { PRType } from '@/stores/pr-store';

const PR_BADGE_CONFIG: Record<PRType, { icon: string; label: string; color: string }> = {
  weight: { icon: '🏋️', label: 'WEIGHT PR', color: '#FFD700' },
  reps: { icon: '🔁', label: 'REP PR', color: '#22C55E' },
  volume: { icon: '📊', label: 'VOLUME PR', color: '#06B6D4' },
};

interface PRToastProps {
  visible: boolean;
  exerciseName: string;
  prTypes: PRType[];
  onDismiss: () => void;
}

export function PRToast({ visible, exerciseName, prTypes, onDismiss }: PRToastProps) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible && prTypes.length > 0) {
      haptics.success();
      setTimeout(() => haptics.heavy(), 150);

      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });

      const hideAfter = 3000;
      translateY.value = withDelay(
        hideAfter,
        withTiming(-120, { duration: 300 }, () => runOnJS(onDismiss)()),
      );
      opacity.value = withDelay(hideAfter, withTiming(0, { duration: 300 }));
    } else {
      translateY.value = -120;
      opacity.value = 0;
      scale.value = 0.8;
    }
  }, [visible, prTypes, translateY, opacity, scale, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || prTypes.length === 0) return null;

  return (
    <Animated.View style={[s.container, animatedStyle]}>
      <View style={s.glow} />
      <View style={s.content}>
        <Text style={s.trophy}>🏆</Text>
        <View style={s.textGroup}>
          <Text style={s.headline}>New Personal Record!</Text>
          <Text style={s.exercise} numberOfLines={1}>
            {exerciseName}
          </Text>
        </View>
        <View style={s.badges}>
          {prTypes.map((type) => {
            const cfg = PR_BADGE_CONFIG[type];
            return (
              <View key={type} style={[s.badge, { borderColor: cfg.color + '66' }]}>
                <Text style={s.badgeIcon}>{cfg.icon}</Text>
                <Text style={[s.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

export function PRBadgeIcon({ type, size = 16 }: { type: PRType; size?: number }) {
  const cfg = PR_BADGE_CONFIG[type];
  return (
    <View
      style={[
        s.badgeIconWrap,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          backgroundColor: cfg.color + '22',
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.7 }}>{cfg.icon}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    opacity: 0.06,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700' + '44',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  trophy: { fontSize: 28 },
  textGroup: { flex: 1, gap: 2 },
  headline: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  exercise: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  badges: { flexDirection: 'column', gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  badgeIcon: { fontSize: 10 },
  badgeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  badgeIconWrap: { alignItems: 'center', justifyContent: 'center' },
});
