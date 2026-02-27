import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';

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
        {stats.map((stat, i) => {
          const isPR = stat.label === 'PRs Set';
          const Wrapper = isPR ? Pressable : View;
          return (
            <Wrapper
              key={stat.label}
              style={[s.item, i < stats.length - 1 && s.divider]}
              {...(isPR && {
                onPress: () => {
                  haptics.light();
                  router.push('/prs');
                },
              })}
            >
              <Text style={s.value}>{stat.value}</Text>
              <Text style={s.label}>{stat.label}</Text>
              {isPR && <Text style={s.tapHint}>Tap to view</Text>}
            </Wrapper>
          );
        })}
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
  tapHint: { color: Colors.textTertiary, fontSize: 8, marginTop: 2 },
});
