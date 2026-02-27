import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card } from '@/components/ui';

export interface HeroWorkoutData {
  label: string;
  name: string;
  exerciseCount: number;
  estimatedMinutes: number;
}

interface HeroWorkoutCardProps {
  workout: HeroWorkoutData | null;
  isRestDay: boolean;
  onStartWorkout?: () => void;
}

export function HeroWorkoutCard({ workout, isRestDay, onStartWorkout }: HeroWorkoutCardProps) {
  if (isRestDay) {
    return (
      <Card variant="elevated" style={s.card}>
        <Text style={s.label}>UP NEXT · REST</Text>
        <View style={s.restRow}>
          <FontAwesome name="moon-o" size={28} color={Colors.textSecondary} />
          <View style={s.restText}>
            <Text style={s.title}>Rest Day</Text>
            <Text style={s.subtitle}>Take time to recover</Text>
          </View>
        </View>
        <View style={s.restBtn}>
          <FontAwesome name="moon-o" size={14} color={Colors.textSecondary} />
          <Text style={s.restBtnText}>REST DAY</Text>
        </View>
      </Card>
    );
  }

  if (!workout) return null;

  return (
    <Card variant="elevated" style={s.card}>
      <Text style={s.label}>{workout.label}</Text>
      <Text style={s.title}>{workout.name}</Text>
      <Text style={s.subtitle}>{workout.exerciseCount} exercises</Text>

      <View style={s.meta}>
        <View style={s.metaItem}>
          <FontAwesome name="clock-o" size={13} color={Colors.textSecondary} />
          <Text style={s.metaText}>{workout.estimatedMinutes} min</Text>
        </View>
        <View style={s.metaItem}>
          <FontAwesome name="bolt" size={13} color={Colors.textSecondary} />
          <Text style={s.metaText}>{workout.exerciseCount} exercises</Text>
        </View>
      </View>

      <Button
        title="START WORKOUT"
        variant="primary"
        size="lg"
        fullWidth
        onPress={onStartWorkout}
      />
    </Card>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 28 },

  label: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginBottom: 16,
  },
  meta: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.textSecondary, fontSize: 13 },

  restRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  restText: { flex: 1 },
  restBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 30,
    paddingVertical: 16,
  },
  restBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
