import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card, Badge } from '@/components/ui';
import { ConfettiOverlay } from '@/components/workout/ConfettiOverlay';
import { ShareableCard, ShareSummaryButton } from '@/components/workout/ShareSummary';
import { getPRDisplayList } from '@/lib/pr-detection';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore, type ExerciseSummary } from '@/stores/workout-store';
import { useSettingsStore } from '@/stores/settings-store';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function WorkoutSummaryScreen() {
  const { completedSummary, reset } = useWorkoutStore();
  const { weightUnit } = useSettingsStore();
  const unit = weightUnit.toUpperCase();
  const [showConfetti, setShowConfetti] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const prDisplayList = useMemo(
    () => (completedSummary ? getPRDisplayList(completedSummary.prs, unit) : []),
    [completedSummary, unit],
  );

  const hasPRs = prDisplayList.length > 0;

  const handleDone = () => {
    haptics.light();
    reset();
    router.replace('/(tabs)');
  };

  const toggleExercise = (index: number) => {
    setExpandedExercise(expandedExercise === index ? null : index);
  };

  if (!completedSummary) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.emptyCenter}>
          <Text style={s.emptyText}>No workout summary available</Text>
          <Button title="Go Home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {hasPRs && (
        <ConfettiOverlay visible={showConfetti} onComplete={() => setShowConfetti(false)} />
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.checkIcon}>✅</Text>
          <Text style={s.headerTitle}>Workout Complete!</Text>
          <Text style={s.headerSubtitle}>{completedSummary.workoutName}</Text>
        </View>

        {/* Hero Stats */}
        <Card variant="highlighted" style={s.heroCard}>
          <View style={s.heroGrid}>
            <StatBlock
              icon="clock-o"
              value={formatDuration(completedSummary.durationSeconds)}
              label="Duration"
            />
            <StatBlock
              icon="bar-chart"
              value={completedSummary.totalVolume.toLocaleString()}
              label={`Volume (${unit})`}
            />
            <StatBlock
              icon="check-circle"
              value={`${completedSummary.totalSetsCompleted}/${completedSummary.totalSetsPlanned}`}
              label="Sets"
            />
            <StatBlock
              icon="tachometer"
              value={
                completedSummary.averageRpe !== null ? completedSummary.averageRpe.toFixed(1) : '—'
              }
              label="Avg RPE"
            />
          </View>
        </Card>

        {/* PR Highlights */}
        {hasPRs && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>🏆 Personal Records</Text>
              <Badge label={`${prDisplayList.length} NEW`} variant="accent" />
            </View>
            {prDisplayList.map((pr, i) => (
              <Card key={`${pr.exerciseName}-${pr.prType}-${i}`} padding={16} style={s.prCard}>
                <View style={s.prRow}>
                  <Text style={s.prIcon}>{pr.icon}</Text>
                  <View style={s.prInfo}>
                    <Text style={s.prExercise}>{pr.exerciseName}</Text>
                    <Text style={s.prLabel}>{pr.label}</Text>
                  </View>
                  <Text style={s.prValue}>{pr.value}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Exercise Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Exercise Breakdown</Text>
          {completedSummary.exercises.map((ex, i) => (
            <ExerciseBreakdownCard
              key={`${ex.exerciseName}-${i}`}
              exercise={ex}
              unit={unit}
              expanded={expandedExercise === i}
              onToggle={() => toggleExercise(i)}
            />
          ))}
        </View>

        {/* Share Card Preview */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Share Your Achievement</Text>
          <ShareableCard summary={completedSummary} unit={unit} />
          <View style={s.shareBtn}>
            <ShareSummaryButton summary={completedSummary} unit={unit} />
          </View>
        </View>

        {/* Done Button */}
        <View style={s.doneSection}>
          <Button title="Done" variant="primary" size="lg" fullWidth onPress={handleDone} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.statBlock}>
      <FontAwesome name={icon as never} size={18} color={Colors.accent} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ExerciseBreakdownCard({
  exercise,
  unit,
  expanded,
  onToggle,
}: {
  exercise: ExerciseSummary;
  unit: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completionPct =
    exercise.totalSets > 0 ? Math.round((exercise.completedSets / exercise.totalSets) * 100) : 0;

  return (
    <Card padding={16} style={s.exerciseCard}>
      <Pressable onPress={onToggle} style={s.exerciseHeader}>
        <View style={s.exerciseInfo}>
          <Text style={s.exerciseName}>{exercise.exerciseName}</Text>
          <View style={s.exerciseTags}>
            {exercise.muscleGroups.slice(0, 2).map((m) => (
              <Badge key={m} label={m} variant="accent" />
            ))}
            <Badge label={exercise.equipment} variant="muted" />
          </View>
        </View>
        <View style={s.exerciseRight}>
          <Text style={s.exerciseSets}>
            {exercise.completedSets}/{exercise.totalSets}
          </Text>
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={Colors.textTertiary}
          />
        </View>
      </Pressable>

      {/* Mini stats row */}
      <View style={s.miniStatsRow}>
        <MiniStat label="Volume" value={`${exercise.totalVolume.toLocaleString()} ${unit}`} />
        <MiniStat
          label="Top Weight"
          value={exercise.topWeight > 0 ? `${exercise.topWeight} ${unit}` : '—'}
        />
        <MiniStat
          label="Avg RPE"
          value={exercise.avgRpe !== null ? exercise.avgRpe.toFixed(1) : '—'}
        />
        <MiniStat label="Complete" value={`${completionPct}%`} />
      </View>

      {/* Expanded set details */}
      {expanded && (
        <View style={s.setDetails}>
          <View style={s.setDetailHeader}>
            <Text style={s.setDetailCol}>SET</Text>
            <Text style={s.setDetailCol}>WEIGHT</Text>
            <Text style={s.setDetailCol}>REPS</Text>
            <Text style={s.setDetailCol}>RPE</Text>
            <Text style={s.setDetailCol}>STATUS</Text>
          </View>
          {exercise.sets.map((set) => (
            <View key={set.id} style={s.setDetailRow}>
              <Text style={s.setDetailCol}>{set.setNumber}</Text>
              <Text style={s.setDetailCol}>{set.weight > 0 ? `${set.weight}` : '—'}</Text>
              <Text style={s.setDetailCol}>{set.reps > 0 ? `${set.reps}` : '—'}</Text>
              <Text style={s.setDetailCol}>{set.rpe !== null ? set.rpe.toFixed(1) : '—'}</Text>
              <Text style={[s.setDetailCol, set.isCompleted ? s.statusDone : s.statusSkipped]}>
                {set.isCompleted ? '✓' : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.miniStat}>
      <Text style={s.miniStatValue}>{value}</Text>
      <Text style={s.miniStatLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  checkIcon: { fontSize: 48, marginBottom: 12 },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  heroCard: { marginBottom: 24 },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBlock: { width: '48%', alignItems: 'center', paddingVertical: 12, gap: 6 },
  statValue: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  prCard: { marginBottom: 8 },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prIcon: { fontSize: 24 },
  prInfo: { flex: 1 },
  prExercise: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  prLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  prValue: { color: '#FFD700', fontSize: 16, fontWeight: '800' },

  exerciseCard: { marginBottom: 10 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  exerciseTags: { flexDirection: 'row', gap: 6 },
  exerciseRight: { alignItems: 'center', gap: 4 },
  exerciseSets: { color: Colors.accent, fontSize: 16, fontWeight: '800' },

  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
  },
  miniStat: { alignItems: 'center', flex: 1 },
  miniStatValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  miniStatLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  setDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
  },
  setDetailHeader: { flexDirection: 'row', paddingBottom: 6, marginBottom: 4 },
  setDetailCol: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setDetailRow: { flexDirection: 'row', paddingVertical: 4 },
  statusDone: { color: Colors.success },
  statusSkipped: { color: Colors.textTertiary },

  shareBtn: { marginTop: 16 },

  doneSection: { marginTop: 8, paddingBottom: 20 },
});
