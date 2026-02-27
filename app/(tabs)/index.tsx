import { useState, useCallback } from 'react';
import { ScrollView, Text, View, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';
import {
  HeroWorkoutCard,
  WeeklyVolumeRings,
  ComingUpScroll,
  RecentWorkouts,
  StatsRow,
} from '@/components/home';
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

const MOCK_STATS: StatItem[] = [
  { value: '1', label: 'Workouts' },
  { value: '4', label: 'Total Sets' },
  { value: '1', label: 'PRs Set' },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isRestDay, setIsRestDay] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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

        {/* ── Hero ───────────────────────────────────── */}
        <HeroWorkoutCard
          workout={MOCK_WORKOUT}
          isRestDay={isRestDay}
          onStartWorkout={() => haptics.medium()}
        />

        {/* ── Weekly Volume ──────────────────────────── */}
        <WeeklyVolumeRings data={MOCK_VOLUME} />

        {/* ── Coming Up ──────────────────────────────── */}
        <ComingUpScroll items={isRestDay ? MOCK_COMING_UP : MOCK_COMING_UP} />

        {/* ── Recent Workouts ────────────────────────── */}
        <RecentWorkouts workouts={MOCK_RECENT} />

        {/* ── Stats ──────────────────────────────────── */}
        <StatsRow stats={MOCK_STATS} />
      </ScrollView>
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
});
