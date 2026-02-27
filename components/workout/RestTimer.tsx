import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';
import { useTimerStore } from '@/stores/timer-store';

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
  { label: '+60s', value: 60 },
];

const RING_SIZE = 200;
const STROKE_WIDTH = 8;

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
    if (!isActive && visible && remainingSeconds === 0 && totalSeconds > 0) {
      onComplete();
    }
  }, [isActive, visible, remainingSeconds, totalSeconds, onComplete]);

  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.container}>
          {/* ── Circular Timer ────────────────────── */}
          <View style={s.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={s.ringSvg}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={Colors.surfaceBorder}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={radius}
                stroke={Colors.accent}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.timeText}>{formatTimer(remainingSeconds)}</Text>
              <Text style={s.remainingLabel}>REMAINING</Text>
            </View>
          </View>

          {/* ── Quick Set ────────────────────────── */}
          <Text style={s.sectionLabel}>QUICK SET</Text>
          <View style={s.quickRow}>
            {QUICK_DURATIONS.map((d) => {
              const active = selectedDuration === d.value;
              return (
                <Pressable
                  key={d.value}
                  onPress={() => store.setDuration(d.value)}
                  style={[s.quickBtn, active && s.quickBtnActive]}
                >
                  <Text style={[s.quickText, active && s.quickTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Extend ───────────────────────────── */}
          <Text style={s.sectionLabel}>EXTEND</Text>
          <View style={s.extendRow}>
            {EXTEND_OPTIONS.map((e) => (
              <Pressable
                key={e.value}
                onPress={() => {
                  haptics.light();
                  store.extend(e.value);
                }}
                style={s.extendBtn}
              >
                <Text style={s.extendText}>{e.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Actions ──────────────────────────── */}
          <View style={s.actionRow}>
            <Pressable
              onPress={() => {
                store.skip();
                onComplete();
              }}
              style={s.skipBtn}
            >
              <FontAwesome name="close" size={16} color={Colors.textSecondary} />
              <Text style={s.skipText}>Skip</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.selection();
                if (isPaused) store.resume();
                else store.pause();
              }}
              style={s.pauseBtn}
            >
              <FontAwesome name={isPaused ? 'play' : 'pause'} size={16} color="#FFFFFF" />
              <Text style={s.pauseText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },

  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ringSvg: { position: 'absolute' },
  ringCenter: { alignItems: 'center' },
  timeText: {
    color: Colors.accent,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  remainingLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },

  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  quickBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  quickText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  quickTextActive: { color: '#FFFFFF' },

  extendRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  extendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  extendText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accent,
  },
  pauseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
