import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';

export interface StatItem {
  value: string;
  label: string;
}

interface StatsRowProps {
  stats: StatItem[];
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <Card>
      <View style={s.row}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[s.item, i < stats.length - 1 && s.divider]}>
            <Text style={s.value}>{stat.value}</Text>
            <Text style={s.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  divider: { borderRightWidth: 1, borderRightColor: Colors.divider },
  value: { color: Colors.accent, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
