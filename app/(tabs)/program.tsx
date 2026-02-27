import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Button, Card, SectionHeader } from '@/components/ui';
import { ProgramCard } from '@/components/program/ProgramCard';
import { haptics } from '@/lib/haptics';
import { useProgramStore } from '@/stores/program-store';

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
  const { programs, removeProgram, setActive, duplicateProgram, loadProgramForEdit } =
    useProgramStore();

  const handleCreate = () => {
    haptics.light();
    router.push('/program/create');
  };

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

        {programs.length === 0 ? (
          <Card padding={24} style={s.emptyCard}>
            <Text style={s.emptyText}>No programs yet. Create your first one!</Text>
          </Card>
        ) : (
          programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onSetActive={() => {
                haptics.medium();
                setActive(p.id);
              }}
              onEdit={() => {
                haptics.light();
                loadProgramForEdit(p.id);
                router.push('/program/create');
              }}
              onDuplicate={() => {
                haptics.success();
                duplicateProgram(p.id);
              }}
              onDelete={() => {
                haptics.warning();
                removeProgram(p.id);
              }}
            />
          ))
        )}

        {/* ── Create New ─────────────────────────────── */}
        <Button
          title="+ Create New Program"
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleCreate}
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
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent },

  emptyCard: { marginBottom: 16 },
  emptyText: { color: Colors.textTertiary, fontSize: 14, textAlign: 'center' },

  createBtn: { marginTop: 4, borderRadius: 16 },
});
