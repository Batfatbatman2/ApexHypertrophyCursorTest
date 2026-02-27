import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card, Badge } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useProgramStore } from '@/stores/program-store';
import { EXERCISE_LIBRARY } from '@/constants/exercises';
import { PROGRAM_TEMPLATES } from '@/constants/templates';
import type { ProgramGoal } from '@/stores/program-store';

const STEPS = ['Basic Info', 'Build Schedule', 'Review'];

let dayCounter = 200;
const genDayId = () => `wd-${dayCounter++}`;

export default function CreateProgramScreen() {
  const store = useProgramStore();
  const { wizard, editingProgramId } = store;
  const isEditing = editingProgramId !== null;
  const [step, setStep] = useState(0);
  const progress = (step + 1) / STEPS.length;

  const handleClose = () => {
    store.resetWizard();
    router.back();
  };

  const handleNext = () => {
    haptics.light();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    haptics.light();
    if (step > 0) setStep(step - 1);
    else handleClose();
  };

  const handleSave = () => {
    haptics.success();
    store.finishWizard();
    router.back();
  };

  const canAdvance =
    step === 0
      ? wizard.name.length > 0 && wizard.goal !== null
      : step === 1
        ? wizard.workoutDays.length > 0
        : true;

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ───────────────────────────────── */}
      <View style={s.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          {step > 0 ? (
            <FontAwesome name="arrow-left" size={18} color={Colors.textSecondary} />
          ) : (
            <View style={{ width: 18 }} />
          )}
        </Pressable>
        <Text style={s.headerTitle}>{isEditing ? 'Edit Program' : 'Create Program'}</Text>
        <Pressable onPress={handleClose} hitSlop={12}>
          <FontAwesome name="close" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Step Indicator ───────────────────────── */}
      <View style={s.stepRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={s.stepItem}>
            <View style={[s.stepDot, i <= step && s.stepDotActive]} />
            {i < STEPS.length - 1 && <View style={[s.stepLine, i < step && s.stepLineActive]} />}
          </View>
        ))}
      </View>
      <Text style={s.stepLabel}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </Text>

      {/* ── Progress ─────────────────────────────── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Content ──────────────────────────────── */}
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <BasicInfoStep />}
        {step === 1 && <BuildScheduleStep />}
        {step === 2 && <ReviewStep />}
      </ScrollView>

      {/* ── Footer ───────────────────────────────── */}
      <View style={s.footer}>
        <Button
          title={
            step === STEPS.length - 1 ? (isEditing ? 'SAVE CHANGES' : 'SAVE PROGRAM') : 'CONTINUE'
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canAdvance}
          onPress={step === STEPS.length - 1 ? handleSave : handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════
   Step 1: Basic Info
   ═══════════════════════════════════════════════════ */
function BasicInfoStep() {
  const { wizard, setWizardName, setWizardDescription, setWizardGoal } = useProgramStore();

  const goalOptions: { id: ProgramGoal; title: string; desc: string }[] = [
    {
      id: 'hypertrophy',
      title: 'Hypertrophy',
      desc: 'Build muscle size with moderate weight and higher reps',
    },
    {
      id: 'strength',
      title: 'Strength',
      desc: 'Increase maximal strength with heavy weight and lower reps',
    },
    {
      id: 'endurance',
      title: 'Endurance',
      desc: 'Improve muscular endurance with lighter weight and high reps',
    },
    {
      id: 'general',
      title: 'General Fitness',
      desc: 'Balanced approach for overall fitness improvement',
    },
  ];

  return (
    <View>
      <Text style={s.fieldLabel}>Program Name</Text>
      <TextInput
        style={s.textInput}
        value={wizard.name}
        onChangeText={setWizardName}
        placeholder="e.g., Push Pull Legs"
        placeholderTextColor={Colors.textTertiary}
      />

      <Text style={s.fieldLabel}>Description (Optional)</Text>
      <TextInput
        style={[s.textInput, s.textArea]}
        value={wizard.description}
        onChangeText={setWizardDescription}
        placeholder="Describe your program..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={3}
      />

      <Text style={s.fieldLabel}>Training Goal</Text>
      {goalOptions.map((g) => {
        const active = wizard.goal === g.id;
        return (
          <Pressable
            key={g.id}
            onPress={() => {
              haptics.selection();
              setWizardGoal(g.id);
            }}
            style={[s.goalCard, active && s.goalCardActive]}
          >
            <View style={s.goalContent}>
              <Text style={[s.goalTitle, active && s.goalTitleActive]}>{g.title}</Text>
              <Text style={s.goalDesc}>{g.desc}</Text>
            </View>
            {active && (
              <View style={s.checkCircle}>
                <FontAwesome name="check" size={12} color="#FFF" />
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Templates */}
      <Text style={[s.fieldLabel, { marginTop: 28 }]}>Quick Start from Template</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {PROGRAM_TEMPLATES.map((t, i) => (
          <Pressable
            key={t.name}
            onPress={() => {
              haptics.light();
              setWizardName(t.name);
              setWizardGoal(t.goal);
              const store = useProgramStore.getState();
              t.workoutDays.forEach((d) => {
                store.addWizardDay({
                  ...d,
                  id: genDayId(),
                });
              });
            }}
            style={[s.templateCard, i < PROGRAM_TEMPLATES.length - 1 ? { marginRight: 12 } : {}]}
          >
            <Text style={s.templateName}>{t.name}</Text>
            <Text style={s.templateDesc} numberOfLines={2}>
              {t.description}
            </Text>
            <Badge label={t.goal.toUpperCase()} variant="accent" />
          </Pressable>
        ))}
      </ScrollView>

      {/* Rolling Schedule Info */}
      <Card padding={16} style={s.infoCard}>
        <View style={s.infoRow}>
          <FontAwesome name="refresh" size={16} color={Colors.accent} />
          <Text style={s.infoTitle}>Rolling Schedule</Text>
        </View>
        <Text style={s.infoDesc}>
          Your workouts will cycle continuously in order. After completing the last workout, you'll
          start back at the first. No fixed days — train when you're ready.
        </Text>
      </Card>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 2: Build Schedule
   ═══════════════════════════════════════════════════ */
function BuildScheduleStep() {
  const { wizard, addWizardDay, removeWizardDay, reorderWizardDay, addExerciseToDay } =
    useProgramStore();
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredExercises = useMemo(() => {
    if (!search) return EXERCISE_LIBRARY.slice(0, 30);
    const q = search.toLowerCase();
    return EXERCISE_LIBRARY.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroups.some((m) => m.includes(q)) ||
        e.equipment.includes(q),
    ).slice(0, 30);
  }, [search]);

  const handleAddWorkout = () => {
    haptics.light();
    addWizardDay({
      id: genDayId(),
      name: `Workout ${wizard.workoutDays.filter((d) => !d.isRestDay).length + 1}`,
      isRestDay: false,
      exercises: [],
    });
  };

  const handleAddRest = () => {
    haptics.light();
    addWizardDay({ id: genDayId(), name: 'Rest', isRestDay: true, exercises: [] });
  };

  if (showExercisePicker) {
    return (
      <View>
        <View style={s.pickerHeader}>
          <Pressable onPress={() => setShowExercisePicker(null)}>
            <FontAwesome name="arrow-left" size={18} color={Colors.textSecondary} />
          </Pressable>
          <Text style={s.pickerTitle}>Add Exercises</Text>
          <Pressable onPress={() => setShowExercisePicker(null)} style={s.pickerDone}>
            <Text style={s.pickerDoneText}>Done</Text>
          </Pressable>
        </View>

        <View style={s.searchWrap}>
          <FontAwesome name="search" size={14} color={Colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {filteredExercises.map((ex) => (
          <Pressable
            key={ex.name}
            onPress={() => {
              haptics.light();
              addExerciseToDay(showExercisePicker, {
                exerciseName: ex.name,
                muscleGroups: ex.muscleGroups,
                equipment: ex.equipment,
                sets: 3,
                reps: ex.isCompound ? 8 : 12,
                setType: 'working',
              });
            }}
            style={s.exCard}
          >
            <View style={s.exInfo}>
              <Text style={s.exName}>{ex.name}</Text>
              <View style={s.exTags}>
                {ex.muscleGroups.slice(0, 2).map((m) => (
                  <Badge key={m} label={m} variant="accent" />
                ))}
                <Badge label={ex.equipment} variant="muted" />
                {ex.isCompound && <Badge label="compound" variant="custom" color={Colors.myoRep} />}
              </View>
            </View>
            <FontAwesome name="plus-circle" size={20} color={Colors.accent} />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View>
      <Card padding={16} style={s.scheduleInfoCard}>
        <View style={s.infoRow}>
          <FontAwesome name="refresh" size={16} color={Colors.accent} />
          <Text style={s.infoTitle}>Rolling Schedule</Text>
        </View>
        <Text style={s.infoDesc}>
          Add workouts and rest days in the order you want. Use the arrows to reorder. The schedule
          will repeat continuously.
        </Text>
      </Card>

      <Text style={s.scheduleCount}>Your Schedule ({wizard.workoutDays.length} days)</Text>

      {wizard.workoutDays.map((day, i) => (
        <Card key={day.id} padding={16} style={s.dayCard}>
          <View style={s.dayHeader}>
            <View style={s.dayReorder}>
              {i > 0 && (
                <Pressable onPress={() => reorderWizardDay(day.id, 'up')} hitSlop={8}>
                  <FontAwesome name="chevron-up" size={12} color={Colors.textTertiary} />
                </Pressable>
              )}
              <View style={[s.dayBadge, day.isRestDay && s.dayBadgeRest]}>
                <Text style={s.dayBadgeText}>{i + 1}</Text>
              </View>
              {i < wizard.workoutDays.length - 1 && (
                <Pressable onPress={() => reorderWizardDay(day.id, 'down')} hitSlop={8}>
                  <FontAwesome name="chevron-down" size={12} color={Colors.textTertiary} />
                </Pressable>
              )}
            </View>

            <View style={s.dayInfo}>
              {day.isRestDay ? (
                <View style={s.restLabel}>
                  <FontAwesome name="moon-o" size={14} color={Colors.textSecondary} />
                  <Text style={s.dayName}>Rest Day</Text>
                </View>
              ) : (
                <>
                  <Text style={s.dayName}>{day.name}</Text>
                  <Text style={s.dayExCount}>{day.exercises.length} exercises</Text>
                </>
              )}
            </View>

            <Pressable
              onPress={() => {
                haptics.light();
                removeWizardDay(day.id);
              }}
              hitSlop={8}
            >
              <FontAwesome name="close" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>

          {!day.isRestDay && (
            <>
              {day.exercises.map((ex, ei) => (
                <Text key={`${ex.exerciseName}-${ei}`} style={s.dayExItem}>
                  {ex.exerciseName} — {ex.sets}×{ex.reps}
                </Text>
              ))}
              <Pressable onPress={() => setShowExercisePicker(day.id)} style={s.addExBtn}>
                <FontAwesome name="plus-circle" size={14} color={Colors.accent} />
                <Text style={s.addExText}>Add Exercises</Text>
              </Pressable>
            </>
          )}
        </Card>
      ))}

      <View style={s.addDayRow}>
        <Button title="+ Add Workout" variant="secondary" size="sm" onPress={handleAddWorkout} />
        <Button title="+ Rest Day" variant="ghost" size="sm" onPress={handleAddRest} />
      </View>

      {wizard.workoutDays.length > 0 && (
        <View style={s.repeatIndicator}>
          <FontAwesome name="refresh" size={12} color={Colors.textTertiary} />
          <Text style={s.repeatText}>Repeats from Day 1</Text>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 3: Review
   ═══════════════════════════════════════════════════ */
function ReviewStep() {
  const { wizard } = useProgramStore();
  const totalEx = wizard.workoutDays.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <View>
      <Text style={s.reviewTitle}>{wizard.name}</Text>
      {wizard.description ? <Text style={s.reviewDesc}>{wizard.description}</Text> : null}

      <View style={s.reviewMeta}>
        <Badge label={(wizard.goal ?? '').toUpperCase()} variant="accent" size="md" />
        <Text style={s.reviewStat}>{wizard.workoutDays.length} days</Text>
        <Text style={s.reviewStat}>{totalEx} exercises</Text>
      </View>

      {wizard.workoutDays.map((day, i) => (
        <Card key={day.id} padding={16} style={s.reviewDay}>
          <View style={s.reviewDayHeader}>
            <Text style={s.reviewDayNum}>Day {i + 1}</Text>
            <Text style={s.reviewDayName}>{day.isRestDay ? '🌙 Rest' : day.name}</Text>
          </View>
          {day.exercises.map((ex, ei) => (
            <Text key={`${ex.exerciseName}-${ei}`} style={s.reviewExItem}>
              {ex.exerciseName} — {ex.sets}×{ex.reps}
            </Text>
          ))}
        </Card>
      ))}
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════ */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 60,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceBorder },
  stepDotActive: { backgroundColor: Colors.accent },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceBorder, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.accent },
  stepLabel: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 8 },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: { height: 3, backgroundColor: Colors.accent, borderRadius: 2 },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 12 },

  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
    marginTop: 20,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCardActive: { borderColor: Colors.accent, backgroundColor: 'rgba(255, 45, 45, 0.06)' },
  goalContent: { flex: 1 },
  goalTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  goalTitleActive: { color: Colors.accent },
  goalDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    width: 160,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  templateName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  templateDesc: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16, marginBottom: 8 },

  infoCard: { marginTop: 24 },
  scheduleInfoCard: { marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  infoDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },

  scheduleCount: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  dayCard: { marginBottom: 12 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  dayReorder: { alignItems: 'center', gap: 4 },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeRest: { backgroundColor: Colors.surfaceLight },
  dayBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  dayInfo: { flex: 1 },
  dayName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  dayExCount: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  restLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayExItem: { color: Colors.textSecondary, fontSize: 13, paddingLeft: 40, paddingVertical: 3 },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 40,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 6,
    justifyContent: 'center',
  },
  addExText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  addDayRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  repeatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  repeatText: { color: Colors.textTertiary, fontSize: 12 },

  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  pickerDone: { paddingVertical: 4, paddingHorizontal: 12 },
  pickerDoneText: { color: Colors.accent, fontSize: 15, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15, paddingVertical: 12 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  exInfo: { flex: 1 },
  exName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  exTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  reviewTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  reviewDesc: { color: Colors.textSecondary, fontSize: 14, marginBottom: 16 },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  reviewStat: { color: Colors.textSecondary, fontSize: 13 },
  reviewDay: { marginBottom: 12 },
  reviewDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewDayNum: { color: Colors.textTertiary, fontSize: 11, fontWeight: '700' },
  reviewDayName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  reviewExItem: { color: Colors.textSecondary, fontSize: 13, paddingVertical: 3, paddingLeft: 8 },
});
