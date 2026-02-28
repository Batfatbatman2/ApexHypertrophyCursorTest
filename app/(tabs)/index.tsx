import { useState, useCallback } from 'react';
import { ScrollView, Text, View, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useProgramStore } from '@/stores/program-store';
import { useWorkoutStore, buildSetsForExercise } from '@/stores/workout-store';
import { useHistoryStore } from '@/stores/history-store';
import { usePRStore } from '@/stores/pr-store';
import { useReadinessStore } from '@/stores/readiness-store';
import { useAICoachStore } from '@/stores/ai-coach-store';
import {
  HeroWorkoutCard,
  WeeklyVolumeRings,
  ComingUpScroll,
  RecentWorkouts,
  StatsRow,
} from '@/components/home';
import { ReadinessSurvey } from '@/components/home/ReadinessSurvey';
import type {
  HeroWorkoutData,
  VolumeData,
  ComingUpItem,
  RecentWorkoutItem,
  StatItem,
} from '@/components/home';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

const MOCK_WORKOUT: HeroWorkoutData = {
  label: 'UP NEXT · PUSH',
  name: 'Push',
  exerciseCount: 6,
  estimatedMinutes: 48,
};

const MOCK_VOLUME: VolumeData[] = [
  { name: 'BACK', current: 0, target: 18 },
  { name: 'CHEST', current: 0, target: 16 },
  { name: 'QUADS', current: 0, target: 16 },
  { name: 'SHOULDERS', current: 0, target: 14 },
];

const MOCK_COMING_UP: ComingUpItem[] = [
  { day: 'TOMORROW', name: 'Pull Day A', exercises: 6, duration: 60 },
  { day: 'THURSDAY', name: 'Legs Day A', exercises: 5, duration: 70 },
  { day: 'FRIDAY', name: 'Push Day B', exercises: 6, duration: 60 },
];

const MOCK_RECENT: RecentWorkoutItem[] = [
  { name: 'Push', date: 'Jan 16', duration: '1 min', sets: 4 },
];

const MOCK_EXERCISES = [
  {
    exerciseName: 'Rear Delt Flyes',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    sets: buildSetsForExercise(3, 8),
  },
  {
    exerciseName: 'Incline Dumbbell Press',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    sets: buildSetsForExercise(3, 10),
  },
  {
    exerciseName: 'Pull-Ups',
    muscleGroups: ['back'],
    equipment: 'bodyweight',
    sets: buildSetsForExercise(3, 8),
  },
  {
    exerciseName: 'Lateral Raise',
    muscleGroups: ['shoulders'],
    equipment: 'dumbbell',
    sets: buildSetsForExercise(3, 15),
  },
  {
    exerciseName: 'Barbell Curl',
    muscleGroups: ['biceps'],
    equipment: 'barbell',
    sets: buildSetsForExercise(3, 10),
  },
  {
    exerciseName: 'Tricep Pushdown',
    muscleGroups: ['triceps'],
    equipment: 'cable',
    sets: buildSetsForExercise(3, 12),
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isRestDay, setIsRestDay] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const { getActiveProgram } = useProgramStore();
  const { startWorkout } = useWorkoutStore();
  const workoutCount = useHistoryStore((s) => s.workouts.length);
  const totalSets = useHistoryStore((s) =>
    s.workouts.reduce((sum, w) => sum + w.totalSetsCompleted, 0),
  );
  const totalPRs = usePRStore((s) => s.totalPRCount);
  const todayEntry = useReadinessStore((s) => s.getTodayEntry());
  const getScore = useReadinessStore((s) => s.getScore);
  const readinessEntries = useReadinessStore((s) => s.entries);
  const coachInsights = useAICoachStore((s) => s.insights);
  const analyzeHistory = useAICoachStore((s) => s.analyzeWorkoutHistory);
  const learningPhase = useAICoachStore((s) => s.learningPhase);
  const totalAnalyzed = useAICoachStore((s) => s.totalWorkoutsAnalyzed);

  const liveStats: StatItem[] = [
    { value: String(workoutCount), label: 'Workouts' },
    { value: String(totalSets), label: 'Total Sets' },
    { value: String(totalPRs), label: 'PRs Set' },
  ];

  const history = useHistoryStore((s) => s.workouts);

  const getGhostData = useCallback(
    (exerciseName: string) => {
      for (const workout of history) {
        const ex = workout.exercises.find((e) => e.exerciseName === exerciseName);
        if (ex && ex.sets.length > 0 && ex.sets.some((st) => st.isCompleted)) {
          return ex.sets
            .filter((st) => st.isCompleted)
            .map((st) => ({ weight: st.weight, reps: st.reps }));
        }
      }
      return undefined;
    },
    [history],
  );

  const handleStartWorkout = useCallback(() => {
    haptics.medium();
    const program = getActiveProgram();
    if (program) {
      const firstWorkoutDay = program.workoutDays.find((d) => !d.isRestDay);
      if (firstWorkoutDay) {
        const exercises = firstWorkoutDay.exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          muscleGroups: ex.muscleGroups,
          equipment: ex.equipment,
          sets: buildSetsForExercise(ex.sets, ex.reps, getGhostData(ex.exerciseName)),
        }));
        startWorkout(firstWorkoutDay.name, exercises);
        router.push('/workout/active');
        return;
      }
    }
    startWorkout('Push', MOCK_EXERCISES);
    router.push('/workout/active');
  }, [getActiveProgram, startWorkout, getGhostData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    analyzeHistory(history, readinessEntries);
    setTimeout(() => setRefreshing(false), 800);
  }, [analyzeHistory, history, readinessEntries]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.surface}
          />
        }
      >
        {/* ── Header ─────────────────────────────────── */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.greeting}>
              {getGreeting()} · {formatDate()}
            </Text>
            <Text style={s.title}>Apex Hypertrophy</Text>
          </View>
          <Pressable
            onPress={() => {
              haptics.selection();
              setIsRestDay(!isRestDay);
            }}
            style={s.toggleBtn}
          >
            <FontAwesome
              name={isRestDay ? 'moon-o' : 'bolt'}
              size={16}
              color={isRestDay ? Colors.textSecondary : Colors.accent}
            />
          </Pressable>
        </View>

        {/* ── Readiness Check-in ────────────────────── */}
        {todayEntry ? (
          <Card padding={14} style={s.readinessCard}>
            <View style={s.readinessRow}>
              <View
                style={[
                  s.readinessDot,
                  {
                    backgroundColor:
                      getScore(todayEntry) >= 70
                        ? '#22C55E'
                        : getScore(todayEntry) >= 40
                          ? '#F59E0B'
                          : '#EF4444',
                  },
                ]}
              />
              <Text style={s.readinessLabel}>Readiness</Text>
              <Text
                style={[
                  s.readinessScore,
                  {
                    color:
                      getScore(todayEntry) >= 70
                        ? '#22C55E'
                        : getScore(todayEntry) >= 40
                          ? '#F59E0B'
                          : '#EF4444',
                  },
                ]}
              >
                {getScore(todayEntry)}%
              </Text>
            </View>
          </Card>
        ) : (
          <Pressable
            onPress={() => {
              haptics.light();
              setShowSurvey(true);
            }}
            style={s.checkinBtn}
          >
            <FontAwesome name="plus-circle" size={16} color={Colors.accent} />
            <Text style={s.checkinBtnText}>Daily Check-in</Text>
            <Text style={s.checkinBtnSub}>Log your readiness</Text>
          </Pressable>
        )}

        {/* ── Hero ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <HeroWorkoutCard
            workout={MOCK_WORKOUT}
            isRestDay={isRestDay}
            onStartWorkout={handleStartWorkout}
          />
        </Animated.View>

        {/* ── Weekly Volume ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <WeeklyVolumeRings data={MOCK_VOLUME} />
        </Animated.View>

        {/* ── Coming Up ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <ComingUpScroll items={isRestDay ? MOCK_COMING_UP : MOCK_COMING_UP} />
        </Animated.View>

        {/* ── Recent Workouts ────────────────────────── */}
        <RecentWorkouts workouts={MOCK_RECENT} />

        {/* ── Stats ──────────────────────────────────── */}
        <StatsRow stats={liveStats} />

        {/* ── AI Coach Insight ─────────────────────── */}
        {coachInsights.length > 0 && (
          <Card padding={14} style={s.coachCard}>
            <View style={s.coachHeader}>
              <View style={s.coachIcon}>
                <FontAwesome name="lightbulb-o" size={14} color="#FACC15" />
              </View>
              <Text style={s.coachLabel}>AI Coach</Text>
              <View style={s.coachBadge}>
                <Text style={s.coachBadgeText}>
                  {Math.round(coachInsights[0].confidence * 100)}%
                </Text>
              </View>
            </View>
            <Text style={s.coachTitle}>{coachInsights[0].title}</Text>
            <Text style={s.coachBody}>{coachInsights[0].body}</Text>
            <View style={s.coachPhase}>
              <View style={s.coachPhaseBar}>
                <View
                  style={[s.coachPhaseFill, { width: `${Math.min(totalAnalyzed * 5, 100)}%` }]}
                />
              </View>
              <Text style={s.coachPhaseText}>
                {learningPhase === 'initial'
                  ? 'Getting to know you'
                  : learningPhase === 'calibrating'
                    ? 'Learning your patterns'
                    : learningPhase === 'optimized'
                      ? 'Fully personalized'
                      : 'Plateau — time for change'}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <ReadinessSurvey visible={showSurvey} onClose={() => setShowSurvey(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  greeting: { color: Colors.textSecondary, fontSize: 14, marginTop: 12 },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  readinessCard: { marginBottom: 16 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readinessDot: { width: 10, height: 10, borderRadius: 5 },
  readinessLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 },
  readinessScore: { fontSize: 18, fontWeight: '800' },

  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accent + '0A',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  checkinBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  checkinBtnSub: { color: Colors.textTertiary, fontSize: 12 },

  coachCard: { marginTop: 16 },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  coachIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(250,204,21,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachLabel: { color: '#FACC15', fontSize: 12, fontWeight: '700', flex: 1 },
  coachBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  coachBadgeText: { color: Colors.textTertiary, fontSize: 10, fontWeight: '700' },
  coachTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  coachBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  coachPhase: { gap: 6 },
  coachPhaseBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  coachPhaseFill: { height: '100%', backgroundColor: '#FACC15', borderRadius: 2 },
  coachPhaseText: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600' },
});
