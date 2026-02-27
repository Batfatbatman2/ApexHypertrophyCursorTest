import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Card, SectionHeader } from '@/components/ui';

export interface ComingUpItem {
  day: string;
  name: string;
  exercises: number;
  duration: number;
}

interface ComingUpScrollProps {
  items: ComingUpItem[];
}

export function ComingUpScroll({ items }: ComingUpScrollProps) {
  if (items.length === 0) return null;

  return (
    <View style={s.section}>
      <SectionHeader title="Coming Up" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item, i) => (
          <Card
            key={`${item.name}-${i}`}
            padding={16}
            style={{
              ...s.card,
              ...(i < items.length - 1 ? { marginRight: 12 } : {}),
            }}
          >
            <Text style={s.day}>{item.day}</Text>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.detail}>{item.exercises} exercises</Text>
            <Text style={s.detail}>{item.duration} min</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 28 },
  card: { width: 148 },
  day: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  detail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
