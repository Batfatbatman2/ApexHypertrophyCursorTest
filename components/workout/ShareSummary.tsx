import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Share, Alert } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { WorkoutSummaryData } from '@/stores/workout-store';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface ShareableCardProps {
  summary: WorkoutSummaryData;
  unit: string;
}

export function ShareableCard({ summary, unit }: ShareableCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.brand}>APEX HYPERTROPHY</Text>
      <Text style={styles.workoutName}>{summary.workoutName}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(summary.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.totalVolume.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Volume ({unit})</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.totalSetsCompleted}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
      </View>
      {summary.prs.length > 0 && (
        <View style={styles.prRow}>
          <Text style={styles.prBadge}>🏆 {summary.prs.length} PRs</Text>
        </View>
      )}
    </View>
  );
}

interface ShareSummaryButtonProps {
  summary: WorkoutSummaryData;
  unit: string;
}

export function ShareSummaryButton({ summary, unit }: ShareSummaryButtonProps) {
  const handleShare = useCallback(async () => {
    haptics.light();

    const prLine = summary.prs.length > 0 ? `\n🏆 ${summary.prs.length} Personal Record(s)!` : '';

    const message =
      `💪 ${summary.workoutName} — Complete!\n\n` +
      `⏱ ${formatDuration(summary.durationSeconds)} ` +
      `| 🔥 ${summary.totalSetsCompleted} sets ` +
      `| 📊 ${summary.totalVolume.toLocaleString()} ${unit} volume` +
      prLine +
      `\n\n— Apex Hypertrophy`;

    if (Platform.OS === 'web') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${summary.workoutName} — Apex Hypertrophy`,
            text: message,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copied!', 'Workout summary copied to clipboard.');
        }
      } catch {
        /* user cancelled */
      }
      return;
    }

    try {
      await Share.share({ message, title: `${summary.workoutName} — Apex Hypertrophy` });
    } catch {
      /* share cancelled */
    }
  }, [summary, unit]);

  return <Button title="Share Summary" variant="secondary" onPress={handleShare} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  brand: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  workoutName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  prRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  prBadge: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
  },
});
