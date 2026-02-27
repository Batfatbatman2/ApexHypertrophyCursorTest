import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card, SectionHeader } from '@/components/ui';
import { haptics } from '@/lib/haptics';

export interface RecentWorkoutItem {
  name: string;
  date: string;
  duration: string;
  sets: number;
}

interface RecentWorkoutsProps {
  workouts: RecentWorkoutItem[];
  onSeeAll?: () => void;
  onPress?: (workout: RecentWorkoutItem) => void;
}

export function RecentWorkouts({ workouts, onSeeAll, onPress }: RecentWorkoutsProps) {
  if (workouts.length === 0) {
    return (
      <View style={s.section}>
        <SectionHeader title="Recent Workouts" />
        <Card padding={24}>
          <Text style={s.emptyText}>No workouts yet. Start your first session!</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <SectionHeader title="Recent Workouts" actionLabel="See All" onAction={onSeeAll} />
      {workouts.map((w, i) => (
        <Pressable
          key={`${w.name}-${i}`}
          onPress={() => {
            haptics.light();
            onPress?.(w);
          }}
        >
          <Card padding={16} style={i < workouts.length - 1 ? { marginBottom: 10 } : undefined}>
            <View style={s.row}>
              <View style={s.info}>
                <Text style={s.name}>{w.name}</Text>
                <Text style={s.meta}>
                  {w.date} · {w.duration} · {w.sets} sets
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  name: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: Colors.textSecondary, fontSize: 12 },
  emptyText: { color: Colors.textTertiary, fontSize: 14, textAlign: 'center' },
});
