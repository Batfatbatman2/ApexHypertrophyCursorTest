import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card, SectionHeader, ProgressRing } from '@/components/ui';

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

const VOLUME_DATA = [
  { name: 'BACK', current: 0, target: 18 },
  { name: 'CHEST', current: 0, target: 16 },
  { name: 'QUADS', current: 0, target: 16 },
  { name: 'SHOULDERS', current: 0, target: 14 },
];

const COMING_UP = [
  { day: 'TOMORROW', name: 'Pull Day A', exercises: 6, duration: 60 },
  { day: 'THURSDAY', name: 'Legs Day A', exercises: 5, duration: 70 },
  { day: 'FRIDAY', name: 'Push Day B', exercises: 6, duration: 60 },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────── */}
        <Text style={s.greeting}>
          {getGreeting()} · {formatDate()}
        </Text>
        <Text style={s.title}>Apex Hypertrophy</Text>

        {/* ── Hero Workout Card ──────────────────────── */}
        <Card variant="elevated" style={s.heroCard}>
          <Text style={s.heroLabel}>UP NEXT · PUSH</Text>
          <Text style={s.heroTitle}>Push</Text>
          <Text style={s.heroSubtitle}>6 exercises</Text>

          <View style={s.heroMeta}>
            <View style={s.metaItem}>
              <FontAwesome name="clock-o" size={13} color={Colors.textSecondary} />
              <Text style={s.metaText}>48 min</Text>
            </View>
            <View style={s.metaItem}>
              <FontAwesome name="bolt" size={13} color={Colors.textSecondary} />
              <Text style={s.metaText}>6 exercises</Text>
            </View>
          </View>

          <Button title="START WORKOUT" variant="primary" size="lg" fullWidth />
        </Card>

        {/* ── Weekly Volume ──────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="Weekly Volume" actionLabel="See All" />
          <Card>
            <View style={s.ringsRow}>
              {VOLUME_DATA.map((m) => (
                <ProgressRing key={m.name} current={m.current} target={m.target} label={m.name} />
              ))}
            </View>
          </Card>
        </View>

        {/* ── Coming Up ──────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="Coming Up" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {COMING_UP.map((item, i) => (
              <Card
                key={item.name}
                padding={16}
                style={{
                  ...s.comingCard,
                  ...(i < COMING_UP.length - 1 ? { marginRight: 12 } : {}),
                }}
              >
                <Text style={s.comingDay}>{item.day}</Text>
                <Text style={s.comingName}>{item.name}</Text>
                <Text style={s.comingDetail}>{item.exercises} exercises</Text>
                <Text style={s.comingDetail}>{item.duration} min</Text>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* ── Recent Workouts ────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="Recent Workouts" actionLabel="See All" />
          <Card padding={16}>
            <View style={s.recentRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.recentName}>Push</Text>
                <Text style={s.recentMeta}>Jan 16 · 1 min · 4 sets</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
            </View>
          </Card>
        </View>

        {/* ── Bottom Stats ───────────────────────────── */}
        <Card>
          <View style={s.statsRow}>
            {[
              { value: '1', label: 'Workouts' },
              { value: '4', label: 'Total Sets' },
              { value: '1', label: 'PRs Set' },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={[s.statItem, i < arr.length - 1 && s.statDivider]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  greeting: { color: Colors.textSecondary, fontSize: 14, marginTop: 12 },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  heroCard: { marginBottom: 28 },
  heroLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginBottom: 16,
  },
  heroMeta: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.textSecondary, fontSize: 13 },

  section: { marginBottom: 28 },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  comingCard: { width: 148 },
  comingDay: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  comingName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  comingDetail: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recentMeta: { color: Colors.textSecondary, fontSize: 12 },

  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  statValue: {
    color: Colors.accent,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
