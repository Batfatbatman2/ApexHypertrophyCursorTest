import { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useHistoryStore } from '@/stores/history-store';
import type { WorkoutSummaryData } from '@/stores/workout-store';

const RANGES = [
  { label: '4W', days: 28 },
  { label: '8W', days: 56 },
  { label: '12W', days: 84 },
  { label: 'All', days: 99999 },
] as const;

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#FF2D2D',
  back: '#06B6D4',
  shoulders: '#F97316',
  quads: '#22C55E',
  hamstrings: '#8B5CF6',
  biceps: '#FACC15',
  triceps: '#EC4899',
  glutes: '#14B8A6',
  calves: '#6366F1',
  abs: '#F43F5E',
  forearms: '#84CC16',
  traps: '#A78BFA',
};

function getDayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getWeekStart(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatWeekLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m` : `${s}s`;
}

function computeStreak(workouts: WorkoutSummaryData[]): number {
  if (workouts.length === 0) return 0;
  const uniqueDays = [...new Set(workouts.map((w) => getDayStart(w.completedAt)))].sort(
    (a, b) => b - a,
  );
  const today = getDayStart(Date.now());
  const DAY = 86400000;
  let streak = 0;
  let expected = today;

  if (uniqueDays[0] < expected - DAY) return 0;
  if (uniqueDays[0] === expected) {
    streak = 1;
    expected -= DAY;
  }
  for (const day of uniqueDays) {
    if (day === expected) {
      streak++;
      expected -= DAY;
    } else if (day < expected) {
      break;
    }
  }
  return streak;
}

export default function AnalyticsScreen() {
  const allWorkouts = useHistoryStore((s) => s.workouts);
  const [rangeIdx, setRangeIdx] = useState(1);
  const range = RANGES[rangeIdx];

  const filtered = useMemo(() => {
    const cutoff = Date.now() - range.days * 86400000;
    return allWorkouts.filter((w) => w.completedAt >= cutoff);
  }, [allWorkouts, range.days]);

  const stats = useMemo(() => {
    const totalSets = filtered.reduce((s, w) => s + w.totalSetsCompleted, 0);
    const totalVolume = filtered.reduce((s, w) => s + w.totalVolume, 0);
    const weeks = Math.max(range.days / 7, 1);
    const perWeek =
      filtered.length > 0
        ? (filtered.length / Math.min(weeks, range.days === 99999 ? 52 : weeks)).toFixed(1)
        : '0';
    const avgRpeVals = filtered.map((w) => w.averageRpe).filter((v): v is number => v !== null);
    const avgRpe =
      avgRpeVals.length > 0
        ? (avgRpeVals.reduce((a, b) => a + b, 0) / avgRpeVals.length).toFixed(1)
        : '—';

    return {
      streak: computeStreak(allWorkouts),
      workouts: filtered.length,
      totalSets,
      perWeek,
      totalVolume,
      avgRpe,
      prs: filtered.reduce((s, w) => s + w.prs.length, 0),
    };
  }, [filtered, range.days, allWorkouts]);

  const weeklyData = useMemo(() => {
    const weeks = Math.min(range.days === 99999 ? 8 : Math.ceil(range.days / 7), 8);
    const now = getWeekStart(Date.now());
    const DAY = 86400000;
    const data: {
      weekStart: number;
      label: string;
      sets: number;
      volume: number;
      workouts: number;
    }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const ws = now - i * 7 * DAY;
      const we = ws + 7 * DAY;
      const inWeek = filtered.filter((w) => w.completedAt >= ws && w.completedAt < we);
      data.push({
        weekStart: ws,
        label: formatWeekLabel(ws),
        sets: inWeek.reduce((s, w) => s + w.totalSetsCompleted, 0),
        volume: inWeek.reduce((s, w) => s + w.totalVolume, 0),
        workouts: inWeek.length,
      });
    }
    return data;
  }, [filtered, range.days]);

  const maxBarValue = Math.max(...weeklyData.map((w) => w.sets), 1);

  const muscleData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of filtered) {
      for (const ex of w.exercises) {
        for (const mg of ex.muscleGroups) {
          const key = mg.toLowerCase();
          map[key] = (map[key] ?? 0) + ex.completedSets;
        }
      }
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    return { entries, total };
  }, [filtered]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────── */}
        <Text style={s.title}>Analytics</Text>

        {/* ── Range Selector ──────────────────────── */}
        <View style={s.rangeBar}>
          {RANGES.map((r, i) => {
            const active = i === rangeIdx;
            return (
              <Pressable
                key={r.label}
                onPress={() => {
                  haptics.selection();
                  setRangeIdx(i);
                }}
                style={[s.rangeChip, active && s.rangeChipActive]}
              >
                <Text style={[s.rangeText, active && s.rangeTextActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Stat Cards ─────────────────────────── */}
        <View style={s.statsRow}>
          <StatCard icon="fire" value={String(stats.streak)} label="Streak" suffix="d" />
          <StatCard icon="bolt" value={String(stats.workouts)} label="Workouts" />
          <StatCard icon="bar-chart" value={String(stats.totalSets)} label="Sets" />
          <StatCard icon="trophy" value={String(stats.prs)} label="PRs" />
        </View>

        {/* ── Volume Trend ───────────────────────── */}
        <Card style={s.section}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>Weekly Volume</Text>
              <Text style={s.cardMeta}>{stats.totalVolume.toLocaleString()} lbs total</Text>
            </View>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
                <Text style={s.legendLabel}>Sets</Text>
              </View>
            </View>
          </View>

          <View style={s.chartWrap}>
            {weeklyData.map((w, i) => {
              const h = maxBarValue > 0 ? (w.sets / maxBarValue) * 100 : 0;
              const isLast = i === weeklyData.length - 1;
              return (
                <View key={w.weekStart} style={s.barCol}>
                  <Text style={s.barValue}>{w.sets > 0 ? w.sets : ''}</Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        {
                          height: `${Math.max(h, 3)}%`,
                          backgroundColor: isLast ? Colors.accent : Colors.accent + '88',
                          borderRadius: 5,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.barLabel, isLast && s.barLabelActive]}>{w.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── Muscle Split ───────────────────────── */}
        <Card style={s.section}>
          <Text style={s.cardTitle}>Muscle Split</Text>
          <Text style={s.cardMeta}>{muscleData.total} total sets across muscle groups</Text>

          {muscleData.total > 0 ? (
            <>
              <DonutChart entries={muscleData.entries} total={muscleData.total} />
              <View style={s.muscleList}>
                {muscleData.entries.slice(0, 6).map(([key, val]) => {
                  const pct = Math.round((val / muscleData.total) * 100);
                  const color = MUSCLE_COLORS[key] ?? Colors.textTertiary;
                  return (
                    <View key={key} style={s.muscleRow}>
                      <View style={s.muscleLeft}>
                        <View style={[s.muscleDot, { backgroundColor: color }]} />
                        <Text style={s.muscleName}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                      <View style={s.muscleRight}>
                        <Text style={s.muscleVal}>{val}</Text>
                        <View style={s.muscleBarTrack}>
                          <View
                            style={[s.muscleBarFill, { width: `${pct}%`, backgroundColor: color }]}
                          />
                        </View>
                        <Text style={s.musclePct}>{pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text style={s.emptyText}>Complete workouts to see muscle distribution</Text>
          )}
        </Card>

        {/* ── Quick Stats ────────────────────────── */}
        <View style={s.quickStatsRow}>
          <Card style={s.quickStat}>
            <Text style={s.quickStatLabel}>Avg RPE</Text>
            <Text style={s.quickStatValue}>{stats.avgRpe}</Text>
          </Card>
          <Card style={s.quickStat}>
            <Text style={s.quickStatLabel}>Per Week</Text>
            <Text style={s.quickStatValue}>{stats.perWeek}</Text>
          </Card>
        </View>

        {/* ── Strength Progression ──────────────────── */}
        <StrengthProgression workouts={filtered} />

        {/* ── Recent Workouts ────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Workouts</Text>
          {filtered.length > 0 ? (
            filtered
              .slice(0, 5)
              .map((w, i) => <RecentWorkoutCard key={`${w.completedAt}-${i}`} workout={w} />)
          ) : (
            <Card>
              <Text style={s.emptyText}>No workouts in this period</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════
   Strength Progression Chart
   ═══════════════════════════════════════════════════ */
function StrengthProgression({ workouts }: { workouts: WorkoutSummaryData[] }) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.completedSets > 0 && ex.topWeight > 0) names.add(ex.exerciseName);
      }
    }
    return [...names].slice(0, 8);
  }, [workouts]);

  const selected = selectedExercise ?? exerciseNames[0];

  const dataPoints = useMemo(() => {
    if (!selected) return [];
    const points: { date: number; weight: number; label: string }[] = [];
    const sorted = [...workouts].sort((a, b) => a.completedAt - b.completedAt);
    for (const w of sorted) {
      const ex = w.exercises.find((e) => e.exerciseName === selected);
      if (ex && ex.topWeight > 0) {
        points.push({
          date: w.completedAt,
          weight: ex.topWeight,
          label: new Date(w.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        });
      }
    }
    return points;
  }, [workouts, selected]);

  if (exerciseNames.length === 0) return null;

  const maxW = Math.max(...dataPoints.map((p) => p.weight), 1);
  const minW = Math.min(...dataPoints.map((p) => p.weight), maxW);
  const range = maxW - minW || 1;
  const W = 280;
  const H = 120;
  const padding = 8;

  const pathD =
    dataPoints.length > 1
      ? dataPoints
          .map((p, i) => {
            const x = padding + (i / (dataPoints.length - 1)) * (W - padding * 2);
            const y = H - padding - ((p.weight - minW) / range) * (H - padding * 2);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          })
          .join(' ')
      : '';

  return (
    <Card style={s.section}>
      <Text style={s.cardTitle}>Strength Progression</Text>
      <Text style={s.cardMeta}>Top weight per session</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12, marginBottom: 12 }}
      >
        {exerciseNames.map((name) => {
          const active = name === selected;
          return (
            <Pressable
              key={name}
              onPress={() => {
                haptics.selection();
                setSelectedExercise(name);
              }}
              style={[s.exChip, active && s.exChipActive]}
            >
              <Text style={[s.exChipText, active && s.exChipTextActive]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {dataPoints.length > 1 ? (
        <View style={{ alignItems: 'center' }}>
          <Svg width={W} height={H}>
            {pathD ? (
              <Path d={pathD} fill="none" stroke={Colors.accent + '40'} strokeWidth={2} />
            ) : null}
            <Circle
              cx={padding}
              cy={H - padding - ((dataPoints[0].weight - minW) / range) * (H - padding * 2)}
              r={3}
              fill={Colors.accent + '60'}
            />
            {dataPoints.map((p, i) => {
              if (i === 0) return null;
              const x = padding + (i / (dataPoints.length - 1)) * (W - padding * 2);
              const y = H - padding - ((p.weight - minW) / range) * (H - padding * 2);
              return (
                <Circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={i === dataPoints.length - 1 ? Colors.accent : Colors.accent + '60'}
                />
              );
            })}
          </Svg>
          <View style={s.chartLabelsRow}>
            <Text style={s.chartMinMax}>{minW} lbs</Text>
            <Text style={s.chartMinMax}>{maxW} lbs</Text>
          </View>
        </View>
      ) : (
        <View style={s.chartEmpty}>
          <Text style={s.chartEmptyText}>
            {dataPoints.length === 1
              ? 'Need 2+ sessions to show trend'
              : 'No data for this exercise'}
          </Text>
        </View>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════════════════ */
function StatCard({
  icon,
  value,
  label,
  suffix,
}: {
  icon: string;
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <View style={s.statCard}>
      <View style={s.statIconBg}>
        <FontAwesome name={icon as never} size={13} color={Colors.accent} />
      </View>
      <Text style={s.statValue}>
        {value}
        {suffix && <Text style={s.statSuffix}>{suffix}</Text>}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Donut Chart (SVG)
   ═══════════════════════════════════════════════════ */
function DonutChart({ entries, total }: { entries: [string, number][]; total: number }) {
  const SIZE = 140;
  const STROKE = 14;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = entries.map(([key, val]) => {
    const pct = val / total;
    const dash = circumference * pct;
    const gap = circumference - dash;
    const rot = (offset / total) * 360 - 90;
    offset += val;
    return { key, dash, gap, rot, color: MUSCLE_COLORS[key] ?? Colors.textTertiary };
  });

  return (
    <View style={s.donutWrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          stroke={Colors.surfaceBorder}
          strokeWidth={STROKE}
          fill="none"
        />
        {segments.map((seg) => (
          <Circle
            key={seg.key}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={seg.color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeLinecap="butt"
            rotation={seg.rot}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        ))}
      </Svg>
      <View style={s.donutCenter}>
        <Text style={s.donutValue}>{total}</Text>
        <Text style={s.donutLabel}>SETS</Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Recent Workout Card
   ═══════════════════════════════════════════════════ */
function RecentWorkoutCard({ workout }: { workout: WorkoutSummaryData }) {
  const [expanded, setExpanded] = useState(false);
  const topExercises = workout.exercises.filter((e) => e.completedSets > 0).slice(0, 3);
  const remaining = workout.exercises.filter((e) => e.completedSets > 0).length - 3;

  return (
    <Card padding={16} style={s.recentCard}>
      <Pressable onPress={() => setExpanded(!expanded)} style={s.recentHeader}>
        <View style={{ flex: 1 }}>
          <View style={s.recentTitleRow}>
            <Text style={s.recentName}>{workout.workoutName}</Text>
            {workout.prs.length > 0 && (
              <View style={s.prChip}>
                <Text style={s.prChipText}>🏆 {workout.prs.length}</Text>
              </View>
            )}
          </View>
          <Text style={s.recentDate}>{formatDate(workout.completedAt)}</Text>
        </View>

        <View style={s.recentMeta}>
          <View style={s.metaItem}>
            <Text style={s.metaValue}>{workout.totalSetsCompleted}</Text>
            <Text style={s.metaLabel}>sets</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <Text style={s.metaValue}>{formatDuration(workout.durationSeconds)}</Text>
            <Text style={s.metaLabel}>time</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaItem}>
            <Text style={[s.metaValue, { color: Colors.accent }]}>
              {workout.averageRpe?.toFixed(1) ?? '—'}
            </Text>
            <Text style={s.metaLabel}>RPE</Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View style={s.recentBody}>
          {topExercises.map((ex) => (
            <View key={ex.exerciseName} style={s.exRow}>
              <Text style={s.exName}>{ex.exerciseName}</Text>
              <Text style={s.exDetail}>
                {ex.completedSets}×{ex.topReps} @ {ex.topWeight}
              </Text>
            </View>
          ))}
          {remaining > 0 && <Text style={s.exMore}>+{remaining} more exercises</Text>}
        </View>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════ */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  section: { marginBottom: 20 },

  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  rangeBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  rangeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  rangeChipActive: { backgroundColor: Colors.accent },
  rangeText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '700' },
  rangeTextActive: { color: '#FFF' },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  statSuffix: { fontSize: 13, color: Colors.textTertiary, fontWeight: '600' },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { color: Colors.textTertiary, fontSize: 11, fontWeight: '600' },

  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    height: 12,
  },
  barTrack: {
    flex: 1,
    width: '65%',
    maxWidth: 28,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  barLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 6,
  },
  barLabelActive: { color: Colors.textPrimary },

  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutValue: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  donutLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  muscleList: { gap: 8 },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muscleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 90 },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleName: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  muscleRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  muscleVal: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  muscleBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  muscleBarFill: { height: '100%', borderRadius: 3 },
  musclePct: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },

  quickStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  quickStatLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickStatValue: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  recentCard: { marginBottom: 10 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  recentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  prChip: {
    backgroundColor: '#FFD700' + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  prChipText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  recentDate: { color: Colors.textTertiary, fontSize: 12, marginTop: 2 },

  recentMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { alignItems: 'center' },
  metaValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  metaLabel: { color: Colors.textTertiary, fontSize: 9, fontWeight: '600', marginTop: 1 },
  metaDivider: { width: 1, height: 20, backgroundColor: Colors.divider },

  recentBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
  },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  exName: { color: Colors.textSecondary, fontSize: 13 },
  exDetail: { color: Colors.textTertiary, fontSize: 12 },
  exMore: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },

  exChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    marginRight: 8,
  },
  exChipActive: {
    backgroundColor: Colors.accent + '22',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  exChipText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', maxWidth: 120 },
  exChipTextActive: { color: Colors.accent },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  chartMinMax: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600' },
  chartEmpty: { alignItems: 'center', paddingVertical: 24 },
  chartEmptyText: { color: Colors.textTertiary, fontSize: 13 },
});
