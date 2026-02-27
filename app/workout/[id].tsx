import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { SET_TYPES, type SetType } from '@/constants/set-types';
import { Button, Card, Badge, BottomSheetModal } from '@/components/ui';
import { RPEModal } from '@/components/workout/RPEModal';
import { RestTimer } from '@/components/workout/RestTimer';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore, type ActiveSet } from '@/stores/workout-store';
import { useTimerStore } from '@/stores/timer-store';
import { useSettingsStore } from '@/stores/settings-store';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const store = useWorkoutStore();
  const { status, workoutName, exercises, currentExerciseIndex, elapsedSeconds } = store;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pickerSetId, setPickerSetId] = useState<string | null>(null);
  const [showRpe, setShowRpe] = useState(false);
  const [rpeExerciseIndex, setRpeExerciseIndex] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [pendingNav, setPendingNav] = useState<'next' | 'prev' | 'finish' | null>(null);
  const restTimer = useTimerStore();
  const { defaultRestDuration, autoStartTimer } = useSettingsStore();

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => store.tick(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, store]);

  const exercise = exercises[currentExerciseIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];

  const hasCompletedSets = useCallback(
    (exIndex: number) => exercises[exIndex]?.sets.some((s) => s.isCompleted) ?? false,
    [exercises],
  );

  const completedSetsCount = useCallback(
    (exIndex: number) => exercises[exIndex]?.sets.filter((s) => s.isCompleted).length ?? 0,
    [exercises],
  );

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    store.reset();
    router.back();
  }, [store]);

  const performNavigation = useCallback(
    (nav: 'next' | 'prev' | 'finish') => {
      if (nav === 'next') {
        store.nextExercise();
      } else if (nav === 'prev') {
        store.prevExercise();
      } else if (nav === 'finish') {
        if (timerRef.current) clearInterval(timerRef.current);
        haptics.success();
        store.endWorkout();
        router.replace('/workout/summary/completed');
      }
    },
    [store],
  );

  const maybeShowRpeThenNavigate = useCallback(
    (nav: 'next' | 'prev' | 'finish') => {
      if (hasCompletedSets(currentExerciseIndex)) {
        setPendingNav(nav);
        setRpeExerciseIndex(currentExerciseIndex);
        setShowRpe(true);
      } else {
        performNavigation(nav);
      }
    },
    [currentExerciseIndex, hasCompletedSets, performNavigation],
  );

  const handleFinishWorkout = useCallback(() => {
    maybeShowRpeThenNavigate('finish');
  }, [maybeShowRpeThenNavigate]);

  const handleNextExercise = useCallback(() => {
    haptics.light();
    maybeShowRpeThenNavigate('next');
  }, [maybeShowRpeThenNavigate]);

  const handlePrevExercise = useCallback(() => {
    haptics.light();
    maybeShowRpeThenNavigate('prev');
  }, [maybeShowRpeThenNavigate]);

  const handleCompleteSet = useCallback(
    (setId: string) => {
      const st = exercise?.sets.find((x) => x.id === setId);
      if (!st) return;
      if (st.weight <= 0 && st.reps <= 0) {
        haptics.warning();
        return;
      }
      haptics.success();
      store.completeSet(currentExerciseIndex, setId);

      if (autoStartTimer) {
        restTimer.start(defaultRestDuration);
        setShowRestTimer(true);
      }
    },
    [exercise, currentExerciseIndex, store, autoStartTimer, defaultRestDuration, restTimer],
  );

  const handleRpeSubmit = useCallback(
    (rpe: number, muscleConnection: number, _notes: string) => {
      if (rpeExerciseIndex !== null) {
        const ex = exercises[rpeExerciseIndex];
        ex.sets
          .filter((st) => st.isCompleted)
          .forEach((st) => {
            store.updateSet(rpeExerciseIndex, st.id, { rpe, muscleConnection });
          });
      }
      setShowRpe(false);
      setRpeExerciseIndex(null);
      if (pendingNav) {
        performNavigation(pendingNav);
        setPendingNav(null);
      }
    },
    [rpeExerciseIndex, exercises, store, pendingNav, performNavigation],
  );

  const handleRpeSkip = useCallback(() => {
    setShowRpe(false);
    setRpeExerciseIndex(null);
    if (pendingNav) {
      performNavigation(pendingNav);
      setPendingNav(null);
    }
  }, [pendingNav, performNavigation]);

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  const handleCompleteFirstIncomplete = useCallback(() => {
    if (!exercise) return;
    const incomplete = exercise.sets.find((st) => !st.isCompleted);
    if (incomplete) {
      handleCompleteSet(incomplete.id);
    }
  }, [exercise, handleCompleteSet]);

  if (status !== 'active' || !exercise) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.emptyCenter}>
          <Text style={s.emptyText}>No active workout</Text>
          <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ───────────────────────────────── */}
      <View style={s.header}>
        <Pressable onPress={handleClose} hitSlop={12}>
          <FontAwesome name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{workoutName}</Text>
          <Text style={s.headerTimer}>⏱ {formatTime(elapsedSeconds)}</Text>
        </View>
        <Text style={s.headerCounter}>
          {currentExerciseIndex + 1}/{exercises.length}
        </Text>
      </View>

      {/* ── Body ─────────────────────────────────── */}
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Header */}
        <Text style={s.exerciseName}>{exercise.exerciseName}</Text>
        <View style={s.tagRow}>
          {exercise.muscleGroups.slice(0, 2).map((m) => (
            <Badge key={m} label={m} variant="accent" />
          ))}
          <Badge label={exercise.equipment} variant="muted" />
        </View>

        {/* Set Table Header */}
        <View style={s.tableHeader}>
          <Text style={[s.colHeader, s.colSet]}>SET</Text>
          <Text style={[s.colHeader, s.colPrev]}>PREVIOUS</Text>
          <Text style={[s.colHeader, s.colWeight]}>WEIGHT</Text>
          <Text style={[s.colHeader, s.colReps]}>REPS</Text>
          <View style={s.colCheck} />
        </View>

        {/* Set Rows */}
        {exercise.sets.map((set) => (
          <SetRowComponent
            key={set.id}
            set={set}
            exerciseIndex={currentExerciseIndex}
            onTypeTap={() => setPickerSetId(set.id)}
            onComplete={() => handleCompleteSet(set.id)}
          />
        ))}

        {/* Add Set */}
        <View style={s.addRow}>
          <Pressable
            onPress={() => {
              haptics.light();
              store.addSet(currentExerciseIndex);
            }}
            style={s.addSetBtn}
          >
            <FontAwesome name="plus-circle" size={14} color={Colors.success} />
            <Text style={s.addSetText}>Add Set</Text>
          </Pressable>
        </View>

        {/* Up Next Preview */}
        {nextExercise && (
          <Card padding={16} style={s.upNextCard}>
            <Text style={s.upNextLabel}>UP NEXT</Text>
            <Text style={s.upNextName}>{nextExercise.exerciseName}</Text>
            <View style={s.upNextTags}>
              {nextExercise.muscleGroups.slice(0, 2).map((m) => (
                <Badge key={m} label={m} variant="accent" />
              ))}
              <Badge label={nextExercise.equipment} variant="muted" />
              <Text style={s.upNextSets}>{nextExercise.sets.length} sets</Text>
            </View>
          </Card>
        )}

        {/* Finish Workout */}
        <View style={s.finishRow}>
          <Button
            title="FINISH WORKOUT"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleFinishWorkout}
          />
        </View>
      </ScrollView>

      {/* ── Rest Timer (compact bottom bar) ────── */}
      <RestTimer visible={showRestTimer} onComplete={handleRestComplete} />

      {/* ── Footer ───────────────────────────────── */}
      <View style={s.footer}>
        <Pressable
          onPress={handlePrevExercise}
          style={s.navBtn}
          disabled={currentExerciseIndex === 0}
        >
          <FontAwesome
            name="chevron-left"
            size={20}
            color={currentExerciseIndex === 0 ? Colors.surfaceBorder : Colors.textSecondary}
          />
        </Pressable>

        <Button
          title="MARK SET COMPLETE"
          variant="primary"
          size="lg"
          onPress={handleCompleteFirstIncomplete}
          style={s.completeBtn}
        />

        <Pressable
          onPress={handleNextExercise}
          style={s.navBtn}
          disabled={currentExerciseIndex === exercises.length - 1}
        >
          <FontAwesome
            name="chevron-right"
            size={20}
            color={
              currentExerciseIndex === exercises.length - 1
                ? Colors.surfaceBorder
                : Colors.textSecondary
            }
          />
        </Pressable>
      </View>

      {/* ── Set Type Picker ──────────────────────── */}
      <BottomSheetModal visible={pickerSetId !== null} onClose={() => setPickerSetId(null)}>
        <Text style={s.pickerTitle}>Set Type</Text>
        {(Object.keys(SET_TYPES) as SetType[]).map((type) => {
          const config = SET_TYPES[type];
          const currentSet = exercise.sets.find((st) => st.id === pickerSetId);
          const isSelected = currentSet?.setType === type;
          return (
            <Pressable
              key={type}
              onPress={() => {
                haptics.selection();
                if (pickerSetId) {
                  store.changeSetType(currentExerciseIndex, pickerSetId, type);
                }
                setPickerSetId(null);
              }}
              style={[s.pickerRow, isSelected && s.pickerRowSelected]}
            >
              <View style={[s.pickerIcon, { backgroundColor: config.color + '22' }]}>
                <Text style={{ fontSize: 18 }}>{config.icon}</Text>
              </View>
              <Text style={[s.pickerLabel, isSelected && { color: config.color }]}>
                {config.label}
              </Text>
              {isSelected && <FontAwesome name="check" size={16} color={config.color} />}
            </Pressable>
          );
        })}
      </BottomSheetModal>

      {/* ── RPE Feedback Modal (exercise-level) ─── */}
      <RPEModal
        visible={showRpe}
        exerciseName={
          rpeExerciseIndex !== null ? (exercises[rpeExerciseIndex]?.exerciseName ?? '') : ''
        }
        completedSetsCount={rpeExerciseIndex !== null ? completedSetsCount(rpeExerciseIndex) : 0}
        onSubmit={handleRpeSubmit}
        onSkip={handleRpeSkip}
      />
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════
   SetRow Component
   ═══════════════════════════════════════════════════ */
function SetRowComponent({
  set,
  exerciseIndex,
  onTypeTap,
  onComplete,
}: {
  set: ActiveSet;
  exerciseIndex: number;
  onTypeTap: () => void;
  onComplete: () => void;
}) {
  const store = useWorkoutStore();
  const config = SET_TYPES[set.setType] || SET_TYPES.working;
  const isDropChild = set.parentSetId !== null;

  return (
    <View style={[s.setRow, set.isCompleted && s.setRowCompleted, isDropChild && s.setRowIndented]}>
      {/* Type Icon */}
      <Pressable onPress={onTypeTap} style={s.colSet}>
        <View style={[s.typeIcon, { borderColor: config.color }]}>
          <Text style={{ fontSize: 12 }}>{config.icon}</Text>
        </View>
        <Text style={[s.setNum, { color: config.color }]}>
          {isDropChild ? `D${set.setNumber}` : set.setNumber}
        </Text>
      </Pressable>

      {/* Previous */}
      <Text style={[s.colPrev, s.prevText]}>—</Text>

      {/* Weight */}
      <View style={s.colWeight}>
        <TextInput
          style={s.numInput}
          value={set.weight > 0 ? String(set.weight) : ''}
          onChangeText={(t) =>
            store.updateSet(exerciseIndex, set.id, { weight: parseInt(t, 10) || 0 })
          }
          placeholder="0"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Text style={s.unitLabel}>LBS</Text>
      </View>

      {/* Reps */}
      <View style={s.colReps}>
        <TextInput
          style={s.numInput}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(t) =>
            store.updateSet(exerciseIndex, set.id, { reps: parseInt(t, 10) || 0 })
          }
          placeholder="0"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Text style={s.unitLabel}>REPS</Text>
      </View>

      {/* Checkbox */}
      <Pressable onPress={onComplete} style={s.colCheck}>
        {set.isCompleted ? (
          <View style={s.checkDone}>
            <FontAwesome name="check" size={14} color="#FFF" />
          </View>
        ) : (
          <View style={s.checkEmpty} />
        )}
      </Pressable>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════ */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  headerTimer: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  headerCounter: { color: Colors.accent, fontSize: 15, fontWeight: '800' },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },

  exerciseName: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 4,
  },
  colHeader: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  colSet: { width: 48, alignItems: 'center' },
  colPrev: { width: 60, textAlign: 'center' },
  colWeight: { flex: 1, alignItems: 'center' },
  colReps: { flex: 1, alignItems: 'center' },
  colCheck: { width: 40, alignItems: 'center' },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  setRowCompleted: { opacity: 0.6 },
  setRowIndented: { paddingLeft: 16 },

  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  setNum: { fontSize: 10, fontWeight: '700' },

  prevText: { color: Colors.textTertiary, fontSize: 14 },

  numInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: 60,
    paddingVertical: 8,
  },
  unitLabel: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  checkEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  checkDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addSetText: { color: Colors.success, fontSize: 14, fontWeight: '600' },

  upNextCard: { marginBottom: 8 },
  upNextLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  upNextName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  upNextTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upNextSets: { color: Colors.textSecondary, fontSize: 12 },

  finishRow: { marginTop: 16, marginBottom: 8 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
    gap: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: { flex: 1 },

  pickerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: Colors.surfaceLight,
    gap: 14,
  },
  pickerRowSelected: { backgroundColor: 'rgba(255,255,255,0.06)' },
  pickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
