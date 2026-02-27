import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Card, SectionHeader, ProgressRing } from '@/components/ui';

export interface VolumeData {
  name: string;
  current: number;
  target: number;
}

interface WeeklyVolumeRingsProps {
  data: VolumeData[];
  onSeeAll?: () => void;
}

export function WeeklyVolumeRings({ data, onSeeAll }: WeeklyVolumeRingsProps) {
  return (
    <View style={s.section}>
      <SectionHeader title="Weekly Volume" actionLabel="See All" onAction={onSeeAll} />
      <Card>
        <View style={s.row}>
          {data.map((m) => (
            <ProgressRing key={m.name} current={m.current} target={m.target} label={m.name} />
          ))}
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
});
