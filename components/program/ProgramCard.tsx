import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card, Badge, Button } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { ProgramData } from '@/stores/program-store';

interface ProgramCardProps {
  program: ProgramData;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetActive?: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'HYPERTROPHY',
  strength: 'STRENGTH',
  endurance: 'ENDURANCE',
  general: 'GENERAL',
};

export function ProgramCard({ program, onEdit, onDelete, onSetActive }: ProgramCardProps) {
  const totalExercises = program.workoutDays.reduce((sum, d) => sum + d.exercises.length, 0);
  const workoutCount = program.workoutDays.filter((d) => !d.isRestDay).length;

  return (
    <Card variant={program.isActive ? 'highlighted' : 'default'} style={s.card}>
      <View style={s.header}>
        <Text style={s.name}>{program.name}</Text>
        {program.isActive && <Badge label="ACTIVE" variant="error" />}
      </View>

      {program.description ? <Text style={s.desc}>{program.description}</Text> : null}

      <View style={s.stats}>
        <View style={s.stat}>
          <FontAwesome name="list" size={12} color={Colors.textTertiary} />
          <Text style={s.statText}>{workoutCount} workouts</Text>
        </View>
        <View style={s.stat}>
          <FontAwesome name="bolt" size={12} color={Colors.textTertiary} />
          <Text style={s.statText}>{totalExercises} exercises</Text>
        </View>
      </View>

      <Badge label={GOAL_LABELS[program.goal] ?? program.goal} variant="accent" size="md" />

      <Text style={s.scheduleLabel}>ROLLING SCHEDULE</Text>
      <View style={s.pillRow}>
        {program.workoutDays.map((d, i) => (
          <View key={d.id} style={d.isRestDay ? s.pillRest : s.pill}>
            {d.isRestDay && <FontAwesome name="moon-o" size={11} color={Colors.textSecondary} />}
            <Text style={s.pillText}>
              {i + 1}. {d.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.actions}>
        {!program.isActive && onSetActive && (
          <Button title="Set Active" variant="primary" size="sm" onPress={onSetActive} />
        )}
        <Pressable
          onPress={() => {
            haptics.light();
            onEdit?.();
          }}
          style={s.actionBtn}
        >
          <FontAwesome name="pencil" size={13} color={Colors.textSecondary} />
          <Text style={s.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.light();
            onDelete?.();
          }}
          style={s.actionBtn}
        >
          <FontAwesome name="trash-o" size={13} color={Colors.error} />
          <Text style={[s.actionText, { color: Colors.error }]}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  desc: { color: Colors.textSecondary, fontSize: 14, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: Colors.textSecondary, fontSize: 13 },
  scheduleLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  pill: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillRest: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
