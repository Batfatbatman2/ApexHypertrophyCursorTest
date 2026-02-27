import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';
import { useTimerStore } from '@/stores/timer-store';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QUICK_DURATIONS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

const EXTEND_OPTIONS = [
  { label: '+15s', value: 15 },
  { label: '+30s', value: 30 },
];

const MINI_RING = 32;
const MINI_STROKE = 3;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface RestTimerProps {
  visible: boolean;
  onComplete: () => void;
}

export function RestTimer({ visible, onComplete }: RestTimerProps) {
  const store = useTimerStore();
  const { isActive, isPaused, totalSeconds, remainingSeconds, selectedDuration } = store;
  const [expanded, setExpanded] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(1);
  const barOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => store.tick(), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, store]);

  useEffect(() => {
    if (totalSeconds > 0) {
      progress.value = withTiming(remainingSeconds / totalSeconds, {
        duration: 950,
        easing: Easing.linear,
      });
    }
  }, [remainingSeconds, totalSeconds, progress]);

  useEffect(() => {
    barOpacity.value = withSpring(visible ? 1 : 0, { damping: 20, stiffness: 300 });
  }, [visible, barOpacity]);

  useEffect(() => {
    if (!isActive && visible && remainingSeconds === 0 && totalSeconds > 0) {
      onComplete();
      setExpanded(false);
    }
  }, [isActive, visible, remainingSeconds, totalSeconds, onComplete]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const progressColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.25, 0.6, 1],
      [Colors.accent, Colors.warmup, Colors.success, Colors.success],
    );
    return { backgroundColor: color };
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
    transform: [{ translateY: (1 - barOpacity.value) * 20 }],
  }));

  const miniRadius = (MINI_RING - MINI_STROKE) / 2;
  const miniCircum = 2 * Math.PI * miniRadius;
  const miniProgress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const miniDashOffset = miniCircum * (1 - miniProgress);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  if (!visible) return null;

  return (
    <Animated.View style={[s.wrapper, containerStyle]}>
      {/* Progress track */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, progressBarStyle, progressColorStyle]} />
      </View>

      {/* Compact bar */}
      <Pressable style={s.bar} onPress={toggleExpand}>
        {/* Mini ring + time */}
        <View style={s.leftGroup}>
          <View style={s.miniRingWrap}>
            <Svg width={MINI_RING} height={MINI_RING}>
              <Circle
                cx={MINI_RING / 2}
                cy={MINI_RING / 2}
                r={miniRadius}
                stroke={Colors.surfaceBorder}
                strokeWidth={MINI_STROKE}
                fill="none"
              />
              <Circle
                cx={MINI_RING / 2}
                cy={MINI_RING / 2}
                r={miniRadius}
                stroke={Colors.accent}
                strokeWidth={MINI_STROKE}
                fill="none"
                strokeDasharray={`${miniCircum}`}
                strokeDashoffset={miniDashOffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${MINI_RING / 2}, ${MINI_RING / 2}`}
              />
            </Svg>
          </View>

          <View>
            <Text style={s.timeText}>{formatTimer(remainingSeconds)}</Text>
            <Text style={s.restLabel}>Rest</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.rightGroup}>
          {EXTEND_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={(e) => {
                e.stopPropagation();
                haptics.light();
                store.extend(opt.value);
              }}
              style={s.extendChip}
            >
              <Text style={s.extendChipText}>{opt.label}</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              haptics.selection();
              if (isPaused) store.resume();
              else store.pause();
            }}
            style={s.controlBtn}
          >
            <FontAwesome name={isPaused ? 'play' : 'pause'} size={12} color="#FFF" />
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              store.skip();
              onComplete();
              setExpanded(false);
            }}
            style={s.skipBtn}
          >
            <FontAwesome name="forward" size={12} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </Pressable>

      {/* Expanded quick-set drawer */}
      {expanded && (
        <View style={s.expandedDrawer}>
          <View style={s.quickRow}>
            {QUICK_DURATIONS.map((d) => {
              const active = selectedDuration === d.value;
              return (
                <Pressable
                  key={d.value}
                  onPress={() => store.setDuration(d.value)}
                  style={[s.quickChip, active && s.quickChipActive]}
                >
                  <Text style={[s.quickChipText, active && s.quickChipTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceBorder,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniRingWrap: {
    width: MINI_RING,
    height: MINI_RING,
  },
  timeText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  restLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 13,
  },

  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  extendChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '66',
    backgroundColor: Colors.accent + '12',
  },
  extendChipText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  controlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandedDrawer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  quickChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
  },
});
