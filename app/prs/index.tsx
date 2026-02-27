import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { usePRStore, type PRType, type ExercisePRHistory } from '@/stores/pr-store';

const PR_CONFIG: Record<PRType, { icon: string; label: string; color: string }> = {
  weight: { icon: '🏋️', label: 'Weight', color: '#FFD700' },
  reps: { icon: '🔁', label: 'Reps', color: '#22C55E' },
  volume: { icon: '📊', label: 'Volume', color: '#06B6D4' },
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatPRValue(type: PRType, value: number, weight: number, reps: number): string {
  switch (type) {
    case 'weight':
      return `${value} lbs`;
    case 'reps':
      return `${reps} reps @ ${weight} lbs`;
    case 'volume':
      return `${value.toLocaleString()} lbs`;
    default:
      return String(value);
  }
}

export default function PRHistoryScreen() {
  const records = usePRStore((s) => s.records);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const exerciseList = useMemo(() => {
    return Object.values(records)
      .filter((r) => r.weightPR || r.repsPR || r.volumePR)
      .sort((a, b) => {
        const aDate = Math.max(
          a.weightPR?.achievedAt ?? 0,
          a.repsPR?.achievedAt ?? 0,
          a.volumePR?.achievedAt ?? 0,
        );
        const bDate = Math.max(
          b.weightPR?.achievedAt ?? 0,
          b.repsPR?.achievedAt ?? 0,
          b.volumePR?.achievedAt ?? 0,
        );
        return bDate - aDate;
      });
  }, [records]);

  const totalPRs = useMemo(
    () =>
      exerciseList.reduce(
        (sum, r) => sum + (r.weightPR ? 1 : 0) + (r.repsPR ? 1 : 0) + (r.volumePR ? 1 : 0),
        0,
      ),
    [exerciseList],
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Text style={s.headerTitle}>Personal Records</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryIcon}>🏆</Text>
            <Text style={s.summaryValue}>{totalPRs}</Text>
            <Text style={s.summaryLabel}>Total PRs</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryIcon}>💪</Text>
            <Text style={s.summaryValue}>{exerciseList.length}</Text>
            <Text style={s.summaryLabel}>Exercises</Text>
          </View>
        </View>

        {/* Exercise PR List */}
        {exerciseList.map((rec) => (
          <ExercisePRCard
            key={rec.exerciseName}
            record={rec}
            expanded={expandedExercise === rec.exerciseName}
            onToggle={() =>
              setExpandedExercise(expandedExercise === rec.exerciseName ? null : rec.exerciseName)
            }
          />
        ))}

        {exerciseList.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🏋️</Text>
            <Text style={s.emptyText}>Complete workouts to set personal records</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExercisePRCard({
  record,
  expanded,
  onToggle,
}: {
  record: ExercisePRHistory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const prCount = (record.weightPR ? 1 : 0) + (record.repsPR ? 1 : 0) + (record.volumePR ? 1 : 0);

  return (
    <Card padding={16} style={s.exCard}>
      <Pressable onPress={onToggle} style={s.exHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.exName}>{record.exerciseName}</Text>
          <Text style={s.exMeta}>
            {prCount} personal record{prCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={Colors.textTertiary}
        />
      </Pressable>

      {/* Current PRs */}
      <View style={s.prGrid}>
        {(['weight', 'reps', 'volume'] as PRType[]).map((type) => {
          const pr =
            type === 'weight' ? record.weightPR : type === 'reps' ? record.repsPR : record.volumePR;
          const cfg = PR_CONFIG[type];
          return (
            <View key={type} style={[s.prChip, !pr && s.prChipEmpty]}>
              <Text style={s.prChipIcon}>{cfg.icon}</Text>
              <Text style={[s.prChipLabel, { color: pr ? cfg.color : Colors.textTertiary }]}>
                {cfg.label}
              </Text>
              <Text
                style={[s.prChipValue, { color: pr ? Colors.textPrimary : Colors.textTertiary }]}
              >
                {pr ? formatPRValue(type, pr.value, pr.weight, pr.reps) : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Expanded history */}
      {expanded && record.history.length > 0 && (
        <View style={s.historySection}>
          <Text style={s.historyTitle}>PR Timeline</Text>
          {[...record.history].reverse().map((pr, i) => {
            const cfg = PR_CONFIG[pr.prType];
            return (
              <View key={`${pr.prType}-${pr.achievedAt}-${i}`} style={s.historyRow}>
                <View style={[s.historyDot, { backgroundColor: cfg.color }]} />
                <View style={s.historyInfo}>
                  <Text style={s.historyType}>{cfg.label} PR</Text>
                  <Text style={s.historyValue}>
                    {formatPRValue(pr.prType, pr.value, pr.weight, pr.reps)}
                  </Text>
                </View>
                <Text style={s.historyDate}>{formatDate(pr.achievedAt)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  summaryIcon: { fontSize: 28, marginBottom: 4 },
  summaryValue: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  summaryLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  exCard: { marginBottom: 12 },
  exHeader: { flexDirection: 'row', alignItems: 'center' },
  exName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  exMeta: { color: Colors.textTertiary, fontSize: 11, marginTop: 2 },

  prGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  prChip: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  prChipEmpty: { opacity: 0.4 },
  prChipIcon: { fontSize: 16 },
  prChipLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  prChipValue: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  historySection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
  },
  historyTitle: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyInfo: { flex: 1 },
  historyType: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  historyValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  historyDate: { color: Colors.textTertiary, fontSize: 11 },

  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textTertiary, fontSize: 14 },
});
