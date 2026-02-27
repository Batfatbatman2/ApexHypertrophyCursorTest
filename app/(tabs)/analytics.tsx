import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card, SectionHeader } from '@/components/ui';
import { haptics } from '@/lib/haptics';

const TIME_RANGES = ['4 weeks', '8 weeks', '12 weeks', 'All'] as const;

const STAT_CARDS = [
  { icon: 'fire' as const, value: '0', label: 'DAY STREAK' },
  { icon: 'bolt' as const, value: '1', label: 'WORKOUTS' },
  { icon: 'bar-chart' as const, value: '4', label: 'TOTAL SETS' },
  { icon: 'calendar' as const, value: '1', label: 'PER WEEK' },
];

const CHART_WEEKS = [
  { label: 'Jan 4', sets: 0, workouts: 0 },
  { label: 'Jan 11', sets: 1, workouts: 1 },
  { label: 'Jan 18', sets: 4, workouts: 1 },
  { label: 'Jan 25', sets: 0, workouts: 0 },
  { label: 'Feb 1', sets: 0, workouts: 0 },
  { label: 'Feb 8', sets: 0, workouts: 0 },
  { label: 'Feb 15', sets: 0, workouts: 0 },
  { label: 'Feb 22', sets: 0, workouts: 0 },
];

const EXERCISES = [
  { name: 'Rear Delt Flyes', sets: 1 },
  { name: 'Incline Dumbbell Press', sets: 0 },
  { name: 'Pull-Ups', sets: 0 },
];

export default function AnalyticsScreen() {
  const [selectedRange, setSelectedRange] = useState<string>('8 weeks');

  const maxBar = Math.max(...CHART_WEEKS.map((w) => Math.max(w.sets, w.workouts)), 1);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Analytics</Text>
        <Text style={s.subtitle}>Track your progress over time</Text>

        {/* ── Time Range Picker ──────────────────────── */}
        <View style={s.rangeRow}>
          {TIME_RANGES.map((range) => {
            const active = selectedRange === range;
            return (
              <Pressable
                key={range}
                onPress={() => {
                  haptics.selection();
                  setSelectedRange(range);
                }}
                style={[s.rangePill, active && s.rangePillActive]}
              >
                <Text style={[s.rangeText, active && s.rangeTextActive]}>{range}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Stat Cards 2×2 ─────────────────────────── */}
        <View style={s.statsGrid}>
          {[0, 1].map((row) => (
            <View key={row} style={s.statsGridRow}>
              {STAT_CARDS.slice(row * 2, row * 2 + 2).map((stat) => (
                <Card key={stat.label} style={s.statCard} padding={20}>
                  <View style={s.statIconWrap}>
                    <FontAwesome name={stat.icon} size={16} color={Colors.accent} />
                  </View>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </Card>
              ))}
            </View>
          ))}
        </View>

        {/* ── Weekly Volume Chart ────────────────────── */}
        <Card style={s.section}>
          <Text style={s.cardTitle}>Weekly Volume</Text>
          <Text style={s.cardSubtitle}>Sets completed per week</Text>

          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
              <Text style={s.legendText}>Sets</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={s.legendText}>Workouts</Text>
            </View>
          </View>

          <View style={s.chartArea}>
            {[4, 2, 0].map((line) => (
              <View key={line} style={s.gridLine}>
                <Text style={s.gridLabel}>{line}</Text>
                <View style={s.gridDash} />
              </View>
            ))}
            <View style={s.barsRow}>
              {CHART_WEEKS.map((w) => (
                <View key={w.label} style={s.barGroup}>
                  <View style={s.barPair}>
                    <View
                      style={[s.bar, s.barSets, { height: Math.max((w.sets / maxBar) * 80, 2) }]}
                    />
                    <View
                      style={[
                        s.bar,
                        s.barWorkouts,
                        { height: Math.max((w.workouts / maxBar) * 80, 2) },
                      ]}
                    />
                  </View>
                  <Text style={s.barLabel}>{w.label.split(' ')[0]}</Text>
                  <Text style={s.barLabelSub}>{w.label.split(' ')[1]}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── Muscle Group Distribution ──────────────── */}
        <Card style={s.section}>
          <Text style={s.cardTitle}>Muscle Group Distribution</Text>
          <View style={s.pieCenter}>
            <View style={s.pieRing}>
              <Text style={s.pieValue}>4</Text>
              <Text style={s.pieLabel}>Total Sets</Text>
            </View>
          </View>
          <View style={s.pieLegend}>
            <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={s.legendText}>Chest 4 (100%)</Text>
          </View>
        </Card>

        {/* ── Recent Workouts ────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="Recent Workouts" actionLabel="See All" />
          <Card padding={16}>
            <View style={s.workoutHeader}>
              <View>
                <Text style={s.workoutName}>Push</Text>
                <Text style={s.workoutDate}>Fri, Jan 16</Text>
              </View>
              <View style={s.workoutMetaRow}>
                <WorkoutStat value="4" label="sets" />
                <WorkoutStat value="0 min" label="time" />
                <WorkoutStat value="8.5" label="RPE" highlight />
              </View>
            </View>
            <View style={s.divider} />
            {EXERCISES.map((ex) => (
              <View key={ex.name} style={s.exRow}>
                <Text style={s.exName}>{ex.name}</Text>
                <Text style={s.exSets}>{ex.sets} sets</Text>
              </View>
            ))}
            <Text style={s.moreExercises}>+3 more exercises</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkoutStat({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={s.wStat}>
      <Text style={[s.wStatValue, highlight && { color: Colors.accent }]}>{value}</Text>
      <Text style={s.wStatLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  section: { marginBottom: 24 },

  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 22 },

  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  rangePill: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rangePillActive: { backgroundColor: Colors.accent },
  rangeText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  rangeTextActive: { color: '#FFFFFF' },

  statsGrid: { gap: 12, marginBottom: 24 },
  statsGridRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 45, 45, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { color: Colors.accent, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  cardTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { color: Colors.textSecondary, fontSize: 12, marginBottom: 16 },

  legendRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textSecondary, fontSize: 12 },

  chartArea: { height: 140, position: 'relative', justifyContent: 'space-between' },
  gridLine: { flexDirection: 'row', alignItems: 'center' },
  gridLabel: { color: Colors.textTertiary, fontSize: 10, width: 20, textAlign: 'right' },
  gridDash: {
    flex: 1,
    height: 1,
    marginLeft: 8,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: Colors.divider,
  },
  barsRow: {
    position: 'absolute',
    bottom: 0,
    left: 28,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  bar: { width: 8, borderRadius: 4, minHeight: 2 },
  barSets: { backgroundColor: Colors.accent },
  barWorkouts: { backgroundColor: Colors.success },
  barLabel: { color: Colors.textTertiary, fontSize: 8, marginTop: 4 },
  barLabelSub: { color: Colors.textTertiary, fontSize: 8 },

  pieCenter: { alignItems: 'center', marginVertical: 16 },
  pieRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  pieLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  pieLegend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },

  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  workoutDate: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  workoutMetaRow: { flexDirection: 'row', gap: 16 },
  wStat: { alignItems: 'center' },
  wStatValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  wStatLabel: { color: Colors.textSecondary, fontSize: 10, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 12 },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  exName: { color: Colors.textSecondary, fontSize: 13 },
  exSets: { color: Colors.textTertiary, fontSize: 13 },
  moreExercises: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
