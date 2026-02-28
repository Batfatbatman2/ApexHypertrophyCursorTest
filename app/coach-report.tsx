import { useMemo } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { useHistoryStore } from '@/stores/history-store';
import { useReadinessStore } from '@/stores/readiness-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { WorkoutSummaryData } from '@/stores/workout-store';

const WEEK_MS = 7 * 86400000;

function getWeekWorkouts(workouts: WorkoutSummaryData[]): WorkoutSummaryData[] {
  const cutoff = Date.now() - WEEK_MS;
  return workouts.filter((w) => w.completedAt >= cutoff);
}

export default function CoachReportScreen() {
  const allWorkouts = useHistoryStore((s) => s.workouts);
  const readinessEntries = useReadinessStore((s) => s.entries);
  const getScore = useReadinessStore((s) => s.getScore);
  const volumeTargets = useSettingsStore((s) => s.volumeTargets);

  const week = useMemo(() => getWeekWorkouts(allWorkouts), [allWorkouts]);
  const prevWeek = useMemo(() => {
    const start = Date.now() - 2 * WEEK_MS;
    const end = Date.now() - WEEK_MS;
    return allWorkouts.filter((w) => w.completedAt >= start && w.completedAt < end);
  }, [allWorkouts]);

  const totalSets = week.reduce((s, w) => s + w.totalSetsCompleted, 0);
  const totalVolume = week.reduce((s, w) => s + w.totalVolume, 0);
  const prevVolume = prevWeek.reduce((s, w) => s + w.totalVolume, 0);
  const volumeChange =
    prevVolume > 0 ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100) : 0;

  const avgRpeVals = week.map((w) => w.averageRpe).filter((v): v is number => v !== null);
  const avgRpe =
    avgRpeVals.length > 0
      ? (avgRpeVals.reduce((a, b) => a + b, 0) / avgRpeVals.length).toFixed(1)
      : '—';

  const weekReadiness = readinessEntries.filter((e) => e.surveyedAt >= Date.now() - WEEK_MS);
  const avgReadiness =
    weekReadiness.length > 0
      ? Math.round(weekReadiness.reduce((s, e) => s + getScore(e), 0) / weekReadiness.length)
      : null;

  const muscleVolume = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of week) {
      for (const ex of w.exercises) {
        for (const mg of ex.muscleGroups) {
          const key = mg.toLowerCase();
          map[key] = (map[key] ?? 0) + ex.completedSets;
        }
      }
    }
    return map;
  }, [week]);

  const volumeInsights = useMemo(() => {
    const insights: {
      muscle: string;
      current: number;
      target: number;
      status: 'under' | 'on' | 'over';
    }[] = [];
    for (const [muscle, target] of Object.entries(volumeTargets)) {
      const current = muscleVolume[muscle] ?? 0;
      const ratio = target > 0 ? current / target : 0;
      insights.push({
        muscle,
        current,
        target,
        status: ratio < 0.7 ? 'under' : ratio > 1.15 ? 'over' : 'on',
      });
    }
    return insights.sort((a, b) => a.current / a.target - b.current / b.target);
  }, [muscleVolume, volumeTargets]);

  const headline =
    week.length === 0
      ? 'No workouts this week — time to get moving!'
      : week.length >= 4
        ? 'Great training week — consistency is key!'
        : `${week.length} workout${week.length > 1 ? 's' : ''} this week — keep pushing!`;

  const tips: string[] = [];
  const underTrained = volumeInsights.filter((v) => v.status === 'under' && v.target > 0);
  if (underTrained.length > 0) {
    tips.push(
      `Prioritize ${underTrained
        .slice(0, 2)
        .map((v) => v.muscle)
        .join(' & ')} — they're below target volume`,
    );
  }
  if (avgRpe !== '—' && parseFloat(avgRpe) > 9) {
    tips.push('Average RPE is very high — consider a deload or lighter session');
  }
  if (avgReadiness !== null && avgReadiness < 50) {
    tips.push('Readiness has been low — focus on recovery (sleep, nutrition, stress)');
  }
  if (tips.length === 0) {
    tips.push('Keep consistent and trust the process');
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Text style={s.headerTitle}>Weekly Report</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Card variant="elevated" padding={20} style={s.headlineCard}>
          <FontAwesome name="line-chart" size={20} color={Colors.accent} />
          <Text style={s.headline}>{headline}</Text>
        </Card>

        {/* Key Metrics */}
        <Text style={s.sectionLabel}>KEY METRICS</Text>
        <View style={s.metricsGrid}>
          <MetricTile
            label="Workouts"
            value={String(week.length)}
            icon="bolt"
            color={Colors.accent}
          />
          <MetricTile
            label="Total Sets"
            value={String(totalSets)}
            icon="bar-chart"
            color="#3B82F6"
          />
          <MetricTile
            label="Volume"
            value={`${(totalVolume / 1000).toFixed(1)}k`}
            icon="trophy"
            color="#FACC15"
            suffix="lbs"
            delta={volumeChange}
          />
          <MetricTile label="Avg RPE" value={avgRpe} icon="fire" color="#EF4444" />
        </View>

        {avgReadiness !== null && (
          <>
            <Text style={s.sectionLabel}>READINESS</Text>
            <Card padding={16} style={s.readinessCard}>
              <Text
                style={[
                  s.readinessValue,
                  {
                    color:
                      avgReadiness >= 70 ? '#22C55E' : avgReadiness >= 40 ? '#F59E0B' : '#EF4444',
                  },
                ]}
              >
                {avgReadiness}%
              </Text>
              <Text style={s.readinessLabel}>Avg Readiness ({weekReadiness.length} check-ins)</Text>
            </Card>
          </>
        )}

        {/* Volume Heatmap */}
        <Text style={s.sectionLabel}>VOLUME VS TARGETS</Text>
        <Card padding={16}>
          {volumeInsights
            .filter((v) => v.target > 0)
            .slice(0, 8)
            .map((v) => {
              const pct = v.target > 0 ? Math.min(v.current / v.target, 1.5) : 0;
              const barColor =
                v.status === 'under' ? '#EF4444' : v.status === 'over' ? '#F59E0B' : '#22C55E';
              return (
                <View key={v.muscle} style={s.volumeRow}>
                  <Text style={s.volumeMuscle}>{v.muscle}</Text>
                  <View style={s.volumeBarTrack}>
                    <View
                      style={[
                        s.volumeBarFill,
                        { width: `${(pct / 1.5) * 100}%`, backgroundColor: barColor },
                      ]}
                    />
                    <View style={[s.volumeTarget, { left: `${(1 / 1.5) * 100}%` }]} />
                  </View>
                  <Text style={[s.volumeCount, { color: barColor }]}>
                    {v.current}/{v.target}
                  </Text>
                </View>
              );
            })}
        </Card>

        {/* Actionable Advice */}
        <Text style={s.sectionLabel}>ADVICE</Text>
        <Card padding={16}>
          {tips.map((tip, i) => (
            <View key={i} style={[s.tipRow, i < tips.length - 1 && s.tipBorder]}>
              <View style={s.tipDot} />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({
  label,
  value,
  icon,
  color,
  suffix,
  delta,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  suffix?: string;
  delta?: number;
}) {
  return (
    <Card padding={14} style={s.metricTile}>
      <View style={[s.metricIcon, { backgroundColor: color + '18' }]}>
        <FontAwesome
          name={icon as React.ComponentProps<typeof FontAwesome>['name']}
          size={14}
          color={color}
        />
      </View>
      <Text style={s.metricValue}>
        {value}
        {suffix ? <Text style={s.metricSuffix}> {suffix}</Text> : null}
      </Text>
      {delta !== undefined && delta !== 0 && (
        <Text style={[s.metricDelta, { color: delta > 0 ? '#22C55E' : '#EF4444' }]}>
          {delta > 0 ? '↑' : '↓'}
          {Math.abs(delta)}%
        </Text>
      )}
      <Text style={s.metricLabel}>{label}</Text>
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
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 20 },

  headlineCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  headline: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 },

  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricTile: { width: '47%', alignItems: 'flex-start' },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  metricSuffix: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  metricDelta: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  metricLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2 },

  readinessCard: { alignItems: 'center', marginBottom: 24 },
  readinessValue: { fontSize: 36, fontWeight: '800' },
  readinessLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },

  volumeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  volumeMuscle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    width: 75,
    textTransform: 'capitalize',
  },
  volumeBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  volumeBarFill: { height: '100%', borderRadius: 3 },
  volumeTarget: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  volumeCount: { fontSize: 11, fontWeight: '700', width: 40, textAlign: 'right' },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  tipBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.divider },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginTop: 6 },
  tipText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20, flex: 1 },
});
