import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { SET_TYPES, type SetType } from '@/constants/set-types';
import { Button, Badge, BottomSheetModal } from '@/components/ui';
import { RPEModal } from '@/components/workout/RPEModal';
import { RestTimer } from '@/components/workout/RestTimer';
import { PRToast } from '@/components/workout/PRToast';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore, type ActiveSet } from '@/stores/workout-store';
import { useTimerStore } from '@/stores/timer-store';
import { useSettingsStore } from '@/stores/settings-store';
import { usePRStore, type PRType } from '@/stores/pr-store';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SHORT_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'WARM',
  working: 'WORK',
  myoRep: 'MYO',
  dropSet: 'DROP',
};

type FooterAction = 'complete' | 'next' | 'finish';

export default function WorkoutScreen() {
  const store = useWorkoutStore();
  const { status, workoutName, exercises, currentExerciseIndex, elapsedSeconds } = store;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pickerSetId, setPickerSetId] = useState<string | null>(null);
  const [showRpe, setShowRpe] = useState(false);
  const [rpeExerciseIndex, setRpeExerciseIndex] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [pendingNav, setPendingNav] = useState<'next' | 'prev' | 'finish' | null>(null);
  const [prToast, setPrToast] = useState<{
    visible: boolean;
    exerciseName: string;
    types: PRType[];
  }>({ visible: false, exerciseName: '', types: [] });
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
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const firstIncompleteSetId = useMemo(() => {
    if (!exercise) return null;
    return exercise.sets.find((st) => !st.isCompleted)?.id ?? null;
  }, [exercise]);

  const footerAction: FooterAction = useMemo(() => {
    if (!exercise) return 'complete';
    const allDone = exercise.sets.every((st) => st.isCompleted);
    if (!allDone) return 'complete';
    if (isLastExercise) return 'finish';
    return 'next';
  }, [exercise, isLastExercise]);

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

  const handleCompleteSet = useCallback(
    (setId: string) => {
      const freshState = useWorkoutStore.getState();
      const ex = freshState.exercises[freshState.currentExerciseIndex];
      const st = ex?.sets.find((x) => x.id === setId);
      if (!st) return;
      if (st.weight <= 0 && st.reps <= 0) {
        haptics.warning();
        return;
      }
      haptics.success();
      freshState.completeSet(freshState.currentExerciseIndex, setId);

      const prResult = usePRStore.getState().checkForPR(ex.exerciseName, st.weight, st.reps);
      if (prResult.isNewPR) {
        setPrToast({ visible: true, exerciseName: ex.exerciseName, types: prResult.types });
      }

      if (autoStartTimer) {
        restTimer.start(defaultRestDuration);
        setShowRestTimer(true);
      }
    },
    [autoStartTimer, defaultRestDuration, restTimer],
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

  const handleFooterPress = useCallback(() => {
    if (footerAction === 'complete') {
      if (!exercise) return;
      const incomplete = exercise.sets.find((st) => !st.isCompleted);
      if (incomplete) handleCompleteSet(incomplete.id);
    } else if (footerAction === 'next') {
      haptics.light();
      maybeShowRpeThenNavigate('next');
    } else {
      maybeShowRpeThenNavigate('finish');
    }
  }, [footerAction, exercise, handleCompleteSet, maybeShowRpeThenNavigate]);

  const handleDismissPrToast = useCallback(() => {
    setPrToast({ visible: false, exerciseName: '', types: [] });
  }, []);

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

  const footerLabel =
    footerAction === 'finish'
      ? 'FINISH WORKOUT'
      : footerAction === 'next'
        ? 'NEXT EXERCISE'
        : 'MARK SET COMPLETE';

  return (
    <View style={s.rootWrap}>
      <PRToast
        visible={prToast.visible}
        exerciseName={prToast.exerciseName}
        prTypes={prToast.types}
        onDismiss={handleDismissPrToast}
      />
      <SafeAreaView style={s.safe}>
        {/* ── Header ───────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={s.headerCloseBtn}>
            <FontAwesome name="close" size={18} color={Colors.textSecondary} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {workoutName}
            </Text>
            <View style={s.headerSubRow}>
              <Text style={s.headerTimer}>⏱ {formatTime(elapsedSeconds)}</Text>
              <Text style={s.headerDot}> · </Text>
              <Text style={s.headerExCount}>
                Exercise {currentExerciseIndex + 1}/{exercises.length}
              </Text>
            </View>
          </View>
          <View style={s.headerBolt}>
            <FontAwesome name="bolt" size={16} color="#FFD700" />
          </View>
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
              <Badge key={m} label={m} variant="outlined" size="md" />
            ))}
            <Badge label={exercise.equipment} variant="outlinedMuted" size="md" />
          </View>

          {/* ── Set Table Card ──────────────────────── */}
          <View style={s.setCard}>
            {/* Column Headers */}
            <View style={s.tableHeader}>
              <Text style={[s.colHeader, s.colSet]}>SET</Text>
              <Text style={[s.colHeader, s.colPrev]}>PREV</Text>
              <Text style={[s.colHeader, s.colWeight]}>LBS</Text>
              <Text style={[s.colHeader, s.colReps]}>REPS</Text>
              <View style={s.colCheck} />
            </View>

            {/* Set Rows */}
            {exercise.sets.map((set, idx) => (
              <SetRowComponent
                key={set.id}
                set={set}
                exerciseIndex={currentExerciseIndex}
                isActive={set.id === firstIncompleteSetId}
                isFuture={!set.isCompleted && set.id !== firstIncompleteSetId}
                isLast={idx === exercise.sets.length - 1}
                onTypeTap={() => setPickerSetId(set.id)}
                onComplete={() => handleCompleteSet(set.id)}
              />
            ))}

            {/* Add Set — dashed, inside card */}
            <Pressable
              onPress={() => {
                haptics.light();
                store.addSet(currentExerciseIndex);
              }}
              style={s.addSetBtn}
            >
              <Text style={s.addSetPlus}>+</Text>
              <Text style={s.addSetText}>ADD SET</Text>
            </Pressable>
          </View>

          {/* Up Next Preview — dashed outline */}
          {nextExercise && (
            <View style={s.upNextOuter}>
              <Text style={s.upNextLabel}>UP NEXT</Text>
              <Pressable
                onPress={() => {
                  haptics.light();
                  maybeShowRpeThenNavigate('next');
                }}
                style={s.upNextCard}
              >
                <View style={s.upNextLeft}>
                  <Text style={s.upNextName}>{nextExercise.exerciseName}</Text>
                  <View style={s.upNextTags}>
                    <Badge label={nextExercise.equipment} variant="outlinedMuted" />
                    <Text style={s.upNextSets}>{nextExercise.sets.length} sets</Text>
                  </View>
                </View>
                <View style={s.upNextArrow}>
                  <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* ── Rest Timer (compact bottom bar) ────── */}
        <RestTimer visible={showRestTimer} onComplete={handleRestComplete} />

        {/* ── Footer ───────────────────────────────── */}
        <View style={s.footer}>
          <Pressable
            onPress={() => {
              if (currentExerciseIndex > 0) {
                haptics.light();
                maybeShowRpeThenNavigate('prev');
              }
            }}
            style={[s.navBtn, currentExerciseIndex === 0 && s.navBtnDisabled]}
          >
            <FontAwesome
              name="chevron-left"
              size={14}
              color={currentExerciseIndex > 0 ? Colors.textPrimary : Colors.textTertiary}
            />
          </Pressable>

          <Pressable onPress={handleFooterPress} style={s.mainActionBtn}>
            <Text style={s.mainActionText}>{footerLabel}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!isLastExercise) {
                haptics.light();
                maybeShowRpeThenNavigate('next');
              }
            }}
            style={[s.navBtn, isLastExercise && s.navBtnDisabled]}
          >
            <FontAwesome
              name="chevron-right"
              size={14}
              color={!isLastExercise ? Colors.textPrimary : Colors.textTertiary}
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
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   SetRow Component — Redesigned to match mockup
   ═══════════════════════════════════════════════════ */
function SetRowComponent({
  set,
  exerciseIndex,
  isActive,
  isFuture,
  isLast,
  onTypeTap,
  onComplete,
}: {
  set: ActiveSet;
  exerciseIndex: number;
  isActive: boolean;
  isFuture: boolean;
  isLast: boolean;
  onTypeTap: () => void;
  onComplete: () => void;
}) {
  const store = useWorkoutStore();
  const config = SET_TYPES[set.setType] || SET_TYPES.working;
  const isDropChild = set.parentSetId !== null;
  const typeLabel = SHORT_TYPE_LABELS[set.setType];

  const rowStyle = [
    s.setRow,
    !isLast && s.setRowBorder,
    isDropChild && s.setRowIndented,
    isActive && s.setRowActive,
  ];

  return (
    <View style={rowStyle}>
      {/* ── Type Icon + Label ── */}
      <Pressable onPress={onTypeTap} style={s.colSet}>
        {set.setType === 'warmup' || set.setType === 'dropSet' || set.setType === 'myoRep' ? (
          <View style={[s.typeIconCircle, { backgroundColor: config.color + '1A' }]}>
            <Text style={{ fontSize: 14 }}>{config.icon}</Text>
          </View>
        ) : isActive || set.isCompleted ? (
          <View style={[s.typeNumCircleFilled, { backgroundColor: config.color }]}>
            <Text style={s.typeNumTextFilled}>
              {isDropChild ? `D${set.setNumber}` : set.setNumber}
            </Text>
          </View>
        ) : (
          <View style={s.typeNumPlain}>
            <Text style={[s.typeNumTextPlain, { color: Colors.textTertiary }]}>
              {isDropChild ? `D${set.setNumber}` : set.setNumber}
            </Text>
          </View>
        )}
        <Text style={[s.typeLabelText, { color: isFuture ? Colors.textTertiary : config.color }]}>
          {typeLabel}
        </Text>
      </Pressable>

      {/* ── Previous ── */}
      <View style={s.colPrev}>
        <Text style={[s.prevText, isFuture && s.prevTextDim]}>
          {set.isCompleted ? `${set.weight} × ${set.reps}` : '—'}
        </Text>
      </View>

      {/* ── Weight Input ── */}
      <View style={s.colWeight}>
        <TextInput
          style={[
            s.numInput,
            isActive && s.numInputActive,
            set.isCompleted && s.numInputCompleted,
            isFuture && s.numInputFuture,
          ]}
          value={set.weight > 0 ? String(set.weight) : ''}
          onChangeText={(t) =>
            store.updateSet(exerciseIndex, set.id, { weight: parseInt(t, 10) || 0 })
          }
          placeholder="—"
          placeholderTextColor={isFuture ? Colors.textTertiary + '60' : Colors.textTertiary}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!set.isCompleted}
        />
      </View>

      {/* ── Reps Input ── */}
      <View style={s.colReps}>
        <TextInput
          style={[
            s.numInput,
            isActive && s.numInputActive,
            set.isCompleted && s.numInputCompleted,
            isFuture && s.numInputFuture,
          ]}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(t) =>
            store.updateSet(exerciseIndex, set.id, { reps: parseInt(t, 10) || 0 })
          }
          placeholder="—"
          placeholderTextColor={isFuture ? Colors.textTertiary + '60' : Colors.textTertiary}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!set.isCompleted}
        />
      </View>

      {/* ── Checkbox ── */}
      <Pressable onPress={onComplete} style={s.colCheck} hitSlop={6}>
        {set.isCompleted ? (
          <View style={s.checkDone}>
            <FontAwesome name="check" size={13} color="#FFF" />
          </View>
        ) : (
          <View style={[s.checkEmpty, isFuture && s.checkEmptyDim]} />
        )}
      </Pressable>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Styles — Premium dark UI matching mockup
   ═══════════════════════════════════════════════════ */
const s = StyleSheet.create({
  rootWrap: { flex: 1, position: 'relative' },
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTimer: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  headerDot: { color: Colors.textTertiary, fontSize: 12 },
  headerExCount: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  headerBolt: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Body ── */
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },

  exerciseName: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },

  /* ── Set Table Card ── */
  setCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  colHeader: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  colSet: { width: 50, alignItems: 'center' },
  colPrev: { width: 70, alignItems: 'center' },
  colWeight: { flex: 1, alignItems: 'center' },
  colReps: { flex: 1, alignItems: 'center' },
  colCheck: { width: 40, alignItems: 'center' },

  /* ── Set Row ── */
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 3,
    paddingHorizontal: 4,
  },
  setRowBorder: {},
  setRowIndented: { paddingLeft: 8 },
  setRowActive: {
    backgroundColor: 'rgba(255, 45, 45, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 45, 45, 0.35)',
    shadowColor: '#FF2D2D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },

  /* ── Type Icon ── */
  typeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeNumCircleFilled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeNumTextFilled: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  typeNumPlain: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeNumTextPlain: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeLabelText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  /* ── Previous ── */
  prevText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  prevTextDim: {
    opacity: 0.4,
  },

  /* ── Numeric Inputs ── */
  numInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    width: 58,
    height: 42,
    paddingVertical: 0,
  },
  numInputActive: {
    backgroundColor: 'rgba(255, 45, 45, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 45, 45, 0.35)',
  },
  numInputCompleted: {
    backgroundColor: Colors.surfaceLight,
  },
  numInputFuture: {
    backgroundColor: '#1A1A1A',
    color: Colors.textTertiary,
  },

  /* ── Checkbox ── */
  checkEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333333',
  },
  checkEmptyDim: {
    borderColor: '#2A2A2A',
    opacity: 0.5,
  },
  checkDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Add Set Button (inside card) ── */
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  addSetPlus: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  addSetText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  /* ── Up Next ── */
  upNextOuter: { marginBottom: 8 },
  upNextLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  upNextLeft: { flex: 1 },
  upNextName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  upNextTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upNextSets: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  upNextArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  navBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  mainActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ── Picker ── */
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
