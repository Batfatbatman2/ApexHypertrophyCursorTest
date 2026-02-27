import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card, Badge, SectionHeader } from '@/components/ui';
import { haptics } from '@/lib/haptics';

const SCHEDULE_DAYS = [
  { label: 'MON', date: '3', workout: 'Push' },
  { label: 'TUE', date: '4', workout: null },
  { label: 'WED', date: '5', workout: 'Pull' },
  { label: 'THU', date: '6', workout: null },
  { label: 'FRI', date: '7', workout: 'Legs' },
  { label: 'SAT', date: '8', workout: null },
  { label: 'SUN', date: '9', workout: null },
];

export default function ProgramScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Programs</Text>

        {/* ── Weekly Schedule Strip ──────────────────── */}
        <Card padding={16} style={s.scheduleCard}>
          <View style={s.scheduleRow}>
            {SCHEDULE_DAYS.map((d, i) => {
              const isToday = i === 2;
              const hasWorkout = !!d.workout;
              return (
                <View key={d.label} style={s.dayCol}>
                  <Text style={[s.dayLabel, isToday && s.dayLabelActive]}>{d.label}</Text>
                  <View style={[s.dayCircle, isToday && s.dayCircleActive]}>
                    <Text style={[s.dayDate, isToday && s.dayDateActive]}>{d.date}</Text>
                  </View>
                  {hasWorkout && <View style={s.dayDot} />}
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── My Programs ────────────────────────────── */}
        <SectionHeader title="My Programs" />

        {/* Active Program */}
        <Card variant="highlighted" style={s.programCard}>
          <View style={s.programHeader}>
            <Text style={s.programName}>Push</Text>
            <Badge label="ACTIVE" variant="error" />
          </View>

          <Text style={s.programDesc}>Peas and stuff</Text>

          <View style={s.programStats}>
            <View style={s.programStat}>
              <FontAwesome name="list" size={12} color={Colors.textTertiary} />
              <Text style={s.programStatText}>2 workouts</Text>
            </View>
            <View style={s.programStat}>
              <FontAwesome name="bolt" size={12} color={Colors.textTertiary} />
              <Text style={s.programStatText}>10 exercises</Text>
            </View>
          </View>

          <Badge label="HYPERTROPHY" variant="accent" size="md" />

          <Text style={s.scheduleLabel}>ROLLING SCHEDULE</Text>
          <View style={s.pillRow}>
            {['1. Push', '2. Legs'].map((day) => (
              <View key={day} style={s.pill}>
                <Text style={s.pillText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={s.actionRow}>
            <Pressable onPress={() => haptics.light()} style={s.actionBtn}>
              <FontAwesome name="pencil" size={13} color={Colors.textSecondary} />
              <Text style={s.actionBtnText}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => haptics.light()} style={s.actionBtn}>
              <FontAwesome name="trash-o" size={13} color={Colors.error} />
              <Text style={[s.actionBtnText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        </Card>

        {/* Inactive Program Placeholder */}
        <Card style={s.programCard}>
          <View style={s.programHeader}>
            <Text style={s.programName}>T</Text>
          </View>
          <View style={s.programStats}>
            <View style={s.programStat}>
              <FontAwesome name="list" size={12} color={Colors.textTertiary} />
              <Text style={s.programStatText}>1 workouts</Text>
            </View>
            <View style={s.programStat}>
              <FontAwesome name="bolt" size={12} color={Colors.textTertiary} />
              <Text style={s.programStatText}>0 exercises</Text>
            </View>
          </View>
          <Badge label="HYPERTROPHY" variant="accent" size="md" />
          <Text style={s.scheduleLabel}>ROLLING SCHEDULE</Text>
          <View style={s.pillRow}>
            <View style={s.pillRest}>
              <FontAwesome name="moon-o" size={11} color={Colors.textSecondary} />
              <Text style={s.pillText}>Rest</Text>
            </View>
          </View>
          <View style={s.actionRow}>
            <Button title="Set Active" variant="primary" size="sm" />
            <Pressable onPress={() => haptics.light()} style={s.actionBtn}>
              <FontAwesome name="pencil" size={13} color={Colors.textSecondary} />
              <Text style={s.actionBtnText}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => haptics.light()} style={s.actionBtn}>
              <FontAwesome name="trash-o" size={13} color={Colors.error} />
              <Text style={[s.actionBtnText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        </Card>

        {/* Create New */}
        <Button
          title="+ Create New Program"
          variant="secondary"
          size="md"
          fullWidth
          style={s.createBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 20,
    letterSpacing: -0.3,
  },

  scheduleCard: { marginBottom: 28 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600' },
  dayLabelActive: { color: Colors.accent },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  dayCircleActive: { backgroundColor: Colors.accent },
  dayDate: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  dayDateActive: { color: '#FFFFFF' },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  programCard: { marginBottom: 16 },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  programName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  programDesc: { color: Colors.textSecondary, fontSize: 14, marginBottom: 14 },

  programStats: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  programStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  programStatText: { color: Colors.textSecondary, fontSize: 13 },

  scheduleLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  pill: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillRest: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },

  createBtn: { marginTop: 4, borderRadius: 16 },
});
