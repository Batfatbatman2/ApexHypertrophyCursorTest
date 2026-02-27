import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
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
  const translateY = useSharedValue(-140);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && prTypes.length > 0) {
      haptics.success();
      setTimeout(() => haptics.heavy(), 150);

      translateY.value = withSequence(
        withSpring(0, { damping: 14, stiffness: 200 }),
        withDelay(2800, withTiming(-140, { duration: 300 })),
      );

      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(onDismiss, 3200);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible, prTypes, translateY, onDismiss]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || prTypes.length === 0) return null;

  return (
    <Animated.View style={[s.container, animStyle]}>
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
    top: 12,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
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
