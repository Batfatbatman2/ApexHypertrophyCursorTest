import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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

const DURATIONS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

const RING_SIZE = 44;
const RING_STROKE = 3.5;

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
    }
  }, [isActive, visible, remainingSeconds, totalSeconds, onComplete]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const progressColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.3, 0.7, 1],
      [Colors.accent, Colors.warmup, Colors.success, Colors.success],
    );
    return { backgroundColor: color };
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
    transform: [{ translateY: (1 - barOpacity.value) * 30 }],
  }));

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - ringProgress);

  if (!visible) return null;

  return (
    <Animated.View style={[s.wrapper, containerStyle]}>
      {/* Top progress rail */}
      <View style={s.progressRail}>
        <Animated.View style={[s.progressFill, progressBarStyle, progressColorStyle]} />
      </View>

      <View style={s.content}>
        {/* Left: ring + countdown */}
        <View style={s.timerGroup}>
          <View style={s.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={Colors.surfaceBorder}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={Colors.accent}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            {/* Pause/play overlay inside ring */}
            <Pressable
              style={s.ringOverlay}
              onPress={() => {
                haptics.selection();
                if (isPaused) store.resume();
                else store.pause();
              }}
            >
              <FontAwesome
                name={isPaused ? 'play' : 'pause'}
                size={13}
                color={Colors.textPrimary}
              />
            </Pressable>
          </View>

          <View>
            <Text style={s.countdown}>{formatTimer(remainingSeconds)}</Text>
            <Text style={s.restLabel}>REST</Text>
          </View>
        </View>

        {/* Right: skip */}
        <Pressable
          onPress={() => {
            store.skip();
            onComplete();
          }}
          style={s.skipBtn}
          hitSlop={8}
        >
          <Text style={s.skipText}>Skip</Text>
          <FontAwesome name="angle-right" size={14} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* Duration selector — always visible, inline segmented control */}
      <View style={s.durationRow}>
        {DURATIONS.map((d) => {
          const active = selectedDuration === d.value;
          return (
            <Pressable
              key={d.value}
              onPress={() => store.setDuration(d.value)}
              style={[s.durChip, active && s.durChipActive]}
            >
              <Text style={[s.durChipText, active && s.durChipTextActive]}>{d.label}</Text>
            </Pressable>
          );
        })}

        <View style={s.extendDivider} />

        <Pressable
          onPress={() => {
            haptics.light();
            store.extend(15);
          }}
          style={s.extendBtn}
        >
          <Text style={s.extendBtnText}>+15s</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 76,
    left: 10,
    right: 10,
    borderRadius: 18,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },

  progressRail: {
    height: 3,
    backgroundColor: '#1F1F1F',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },

  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
  },
  ringOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 26,
  },
  restLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    lineHeight: 12,
  },

  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
  },
  skipText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  durChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  durChipActive: {
    backgroundColor: Colors.accent + '1A',
    borderWidth: 1,
    borderColor: Colors.accent + '44',
  },
  durChipText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  durChipTextActive: {
    color: Colors.accent,
  },

  extendDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 4,
  },
  extendBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '55',
  },
  extendBtnText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});
