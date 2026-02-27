import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Pressable
          onPress={() => {
            haptics.selection();
            onAction?.();
          }}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  action: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
