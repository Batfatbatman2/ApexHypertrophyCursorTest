import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { SET_TYPES, type SetType } from '@/constants/set-types';
import { Button, BottomSheetModal } from '@/components/ui';
import { RPEModal } from '@/components/workout/RPEModal';
import { RestTimer } from '@/components/workout/RestTimer';
import { PRToast } from '@/components/workout/PRToast';
import { SetTypeIcon } from '@/components/workout/SetTypeIcon';
import { SetTypeDropdown } from '@/components/workout/SetTypeDropdown';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore, type ActiveSet } from '@/stores/workout-store';
import { useTimerStore } from '@/stores/timer-store';
import { useSettingsStore } from '@/stores/settings-store';
import { usePRStore, type PRType } from '@/stores/pr-store';
import { EXERCISE_LIBRARY } from '@/constants/exercises';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SHORT_LABELS: Record<SetType, string> = {
  warmup: 'WARM',
  working: 'WORK',
  myoRep: 'R-P',
  dropSet: 'DROP',
};

type FooterAction = 'complete' | 'next' | 'finish';

export default function WorkoutScreen() {
  const store = useWorkoutStore();
  const { status, workoutName, exercises, currentExerciseIndex, elapsedSeconds } = store;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dropdown, setDropdown] = useState<{
    setId: string;
    exIdx: number;
    anchorY: number;
    anchorX: number;
  } | null>(null);
  const [showSwap, setShowSwap] = useState(false);
  const [swapSearch, setSwapSearch] = useState('');
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
    return isLastExercise ? 'finish' : 'next';
  }, [exercise, isLastExercise]);

  const hasCompletedSets = useCallback(
    (i: number) => exercises[i]?.sets.some((x) => x.isCompleted) ?? false,
    [exercises],
  );
  const completedSetsCount = useCallback(
    (i: number) => exercises[i]?.sets.filter((x) => x.isCompleted).length ?? 0,
    [exercises],
  );
  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    store.reset();
    router.back();
  }, [store]);

  const performNavigation = useCallback(
    (nav: 'next' | 'prev' | 'finish') => {
      if (nav === 'next') store.nextExercise();
      else if (nav === 'prev') store.prevExercise();
      else {
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
      } else performNavigation(nav);
    },
    [currentExerciseIndex, hasCompletedSets, performNavigation],
  );

  const handleCompleteSet = useCallback(
    (setId: string) => {
      const fs = useWorkoutStore.getState();
      const ex = fs.exercises[fs.currentExerciseIndex];
      const st = ex?.sets.find((x) => x.id === setId);
      if (!st) return;
      if (st.weight <= 0 && st.reps <= 0) {
        haptics.warning();
        return;
      }
      haptics.success();
      fs.completeSet(fs.currentExerciseIndex, setId);
      const prResult = usePRStore.getState().checkForPR(ex.exerciseName, st.weight, st.reps);
      if (prResult.isNewPR)
        setPrToast({ visible: true, exerciseName: ex.exerciseName, types: prResult.types });
      if (autoStartTimer) {
        restTimer.start(defaultRestDuration);
        setShowRestTimer(true);
      }
    },
    [autoStartTimer, defaultRestDuration, restTimer],
  );

  const handleRpeSubmit = useCallback(
    (rpe: number, mc: number, _n: string) => {
      if (rpeExerciseIndex !== null) {
        const ex = exercises[rpeExerciseIndex];
        ex.sets
          .filter((st) => st.isCompleted)
          .forEach((st) => store.updateSet(rpeExerciseIndex, st.id, { rpe, muscleConnection: mc }));
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
  const handleRestComplete = useCallback(() => setShowRestTimer(false), []);
  const handleFooterPress = useCallback(() => {
    if (footerAction === 'complete') {
      if (!exercise) return;
      const inc = exercise.sets.find((st) => !st.isCompleted);
      if (inc) handleCompleteSet(inc.id);
    } else if (footerAction === 'next') {
      haptics.light();
      maybeShowRpeThenNavigate('next');
    } else maybeShowRpeThenNavigate('finish');
  }, [footerAction, exercise, handleCompleteSet, maybeShowRpeThenNavigate]);
  const handleDismissPrToast = useCallback(
    () => setPrToast({ visible: false, exerciseName: '', types: [] }),
    [],
  );

  if (status !== 'active' || !exercise) {
    return (
      <SafeAreaView style={$.safe}>
        <View style={$.emptyCenter}>
          <Text style={$.emptyText}>No active workout</Text>
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
        : 'Mark Set Complete';

  return (
    <View style={$.root}>
      <PRToast
        visible={prToast.visible}
        exerciseName={prToast.exerciseName}
        prTypes={prToast.types}
        onDismiss={handleDismissPrToast}
      />
      <SafeAreaView style={$.safe}>
        {/* ═══ HEADER (glass panel) ═══ */}
        <View style={$.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={$.headerBtn}>
            <FontAwesome name="close" size={20} color="#ddd" />
          </Pressable>
          <View style={$.headerCenter}>
            <Text style={$.headerTitle} numberOfLines={1}>
              {workoutName}
            </Text>
            <View style={$.headerSub}>
              <View style={$.timerPill}>
                <FontAwesome name="clock-o" size={11} color="#888" />
                <Text style={$.timerText}>{formatTime(elapsedSeconds)}</Text>
              </View>
              <View style={$.dot} />
              <Text style={$.exCounter}>
                Exercise {currentExerciseIndex + 1}/{exercises.length}
              </Text>
            </View>
          </View>
          <View style={$.headerBoltWrap}>
            <View style={$.headerBoltBtn}>
              <FontAwesome name="bolt" size={16} color="#facc15" />
            </View>
          </View>
        </View>

        {/* ═══ BODY ═══ */}
        <ScrollView
          style={$.body}
          contentContainerStyle={$.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Info */}
          <View style={$.exInfo}>
            <Text style={$.exName}>{exercise.exerciseName}</Text>
            <View style={$.exBadges}>
              {exercise.muscleGroups.slice(0, 2).map((m) => (
                <View key={m} style={$.badge}>
                  <Text style={$.badgeText}>{m}</Text>
                </View>
              ))}
              <View style={$.badge}>
                <Text style={$.badgeText}>{exercise.equipment}</Text>
              </View>
            </View>
            <View style={$.exActions}>
              {!exercise.sets.some((st) => st.setType === 'warmup') && (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    const workingSet = exercise.sets.find(
                      (st) =>
                        st.setType === 'working' && (st.weight > 0 || (st.ghostWeight ?? 0) > 0),
                    );
                    const w = workingSet?.weight || workingSet?.ghostWeight || 135;
                    store.addWarmupSets(currentExerciseIndex, w);
                  }}
                  style={$.exActionBtn}
                >
                  <FontAwesome name="fire" size={11} color="#FACC15" />
                  <Text style={$.exActionText}>Add Warm-up</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  haptics.light();
                  setSwapSearch('');
                  setShowSwap(true);
                }}
                style={$.exActionBtn}
              >
                <FontAwesome name="exchange" size={11} color={Colors.textSecondary} />
                <Text style={$.exActionText}>Swap</Text>
              </Pressable>
            </View>
          </View>

          {/* ═══ SET TABLE (glass card) ═══ */}
          <View style={$.card}>
            {/* Column headers */}
            <View style={$.colHeaders}>
              <Text style={[$.colH, { width: 44 }]}>TYPE</Text>
              <Text style={[$.colH, { flex: 1 }]}>PREV</Text>
              <Text style={[$.colH, { flex: 1 }]}>LBS</Text>
              <Text style={[$.colH, { flex: 1 }]}>Reps</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Rows */}
            {exercise.sets.map((set) => {
              const isActive = set.id === firstIncompleteSetId;
              const isFuture = !set.isCompleted && !isActive;
              return (
                <SetRow
                  key={set.id}
                  set={set}
                  exIdx={currentExerciseIndex}
                  isActive={isActive}
                  isFuture={isFuture}
                  onTypeTap={(y: number, x: number) =>
                    setDropdown({
                      setId: set.id,
                      exIdx: currentExerciseIndex,
                      anchorY: y,
                      anchorX: x,
                    })
                  }
                  onComplete={() => handleCompleteSet(set.id)}
                />
              );
            })}

            {/* Add Set */}
            <View style={{ paddingTop: 10 }}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  store.addSet(currentExerciseIndex);
                }}
                style={$.addSetBtn}
              >
                <FontAwesome name="plus" size={12} color="#888" />
                <Text style={$.addSetText}>Add Set</Text>
              </Pressable>
            </View>
          </View>

          {/* ═══ UP NEXT ═══ */}
          {nextExercise && (
            <View style={$.upNextWrap}>
              <Text style={$.upNextLabel}>Up Next</Text>
              <Pressable
                onPress={() => {
                  haptics.light();
                  maybeShowRpeThenNavigate('next');
                }}
                style={$.upNextCard}
              >
                <View style={$.upNextAccent} />
                <View style={{ flex: 1 }}>
                  <Text style={$.upNextName}>{nextExercise.exerciseName}</Text>
                  <View style={$.upNextMeta}>
                    <View style={$.upNextBadge}>
                      <Text style={$.upNextBadgeText}>{nextExercise.equipment}</Text>
                    </View>
                    <Text style={$.upNextSets}>{nextExercise.sets.length} sets</Text>
                  </View>
                </View>
                <View style={$.upNextChevron}>
                  <FontAwesome name="chevron-right" size={14} color="#666" />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>

        <RestTimer visible={showRestTimer} onComplete={handleRestComplete} />

        {/* ═══ FOOTER ═══ */}
        <View style={$.footer}>
          <Pressable
            onPress={() => {
              if (currentExerciseIndex > 0) {
                haptics.light();
                maybeShowRpeThenNavigate('prev');
              }
            }}
            style={[$.navBtn, currentExerciseIndex === 0 && { opacity: 0.35 }]}
          >
            <FontAwesome name="chevron-left" size={18} color="#999" />
          </Pressable>
          <Pressable onPress={handleFooterPress} style={$.mainBtn}>
            <Text style={$.mainBtnText}>{footerLabel}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isLastExercise) {
                haptics.light();
                maybeShowRpeThenNavigate('next');
              }
            }}
            style={[$.navBtn, isLastExercise && { opacity: 0.35 }]}
          >
            <FontAwesome name="chevron-right" size={18} color="#999" />
          </Pressable>
        </View>

        {/* Set Type Dropdown */}
        <SetTypeDropdown
          visible={dropdown !== null}
          currentType={
            dropdown
              ? (exercise.sets.find((st) => st.id === dropdown.setId)?.setType ?? 'working')
              : 'working'
          }
          anchorY={dropdown?.anchorY ?? 0}
          anchorX={dropdown?.anchorX ?? 0}
          onSelect={(type) => {
            if (dropdown) store.changeSetType(dropdown.exIdx, dropdown.setId, type);
            setDropdown(null);
          }}
          onClose={() => setDropdown(null)}
        />
        {/* Quick-Swap Modal */}
        <BottomSheetModal visible={showSwap} onClose={() => setShowSwap(false)}>
          <Text style={$.swapTitle}>Quick-Swap Exercise</Text>
          <Text style={$.swapSub}>Same muscle group alternatives</Text>
          <TextInput
            style={$.swapSearch}
            value={swapSearch}
            onChangeText={setSwapSearch}
            placeholder="Search exercises…"
            placeholderTextColor="#666"
          />
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {EXERCISE_LIBRARY.filter((ex) => {
              const mg = exercise.muscleGroups[0]?.toLowerCase();
              const matchesMuscle = ex.muscleGroups.some((g) => g.toLowerCase() === mg);
              const matchesSearch =
                !swapSearch || ex.name.toLowerCase().includes(swapSearch.toLowerCase());
              return matchesMuscle && matchesSearch && ex.name !== exercise.exerciseName;
            })
              .slice(0, 10)
              .map((ex) => (
                <Pressable
                  key={ex.name}
                  onPress={() => {
                    haptics.selection();
                    store.swapExercise(
                      currentExerciseIndex,
                      {
                        exerciseName: ex.name,
                        muscleGroups: ex.muscleGroups,
                        equipment: ex.equipment,
                      },
                      exercise.sets.filter((st) => st.setType === 'working').length || 3,
                      exercise.sets[0]?.reps || 8,
                    );
                    setShowSwap(false);
                  }}
                  style={$.swapRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={$.swapRowName}>{ex.name}</Text>
                    <Text style={$.swapRowMeta}>
                      {ex.equipment} · {ex.isCompound ? 'compound' : 'isolation'}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={11} color="#555" />
                </Pressable>
              ))}
          </ScrollView>
        </BottomSheetModal>
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
   SET ROW — faithful 1:1 from HTML spec
   ═══════════════════════════════════════════════════ */
function SetRow({
  set,
  exIdx,
  isActive,
  isFuture,
  onTypeTap,
  onComplete,
}: {
  set: ActiveSet;
  exIdx: number;
  isActive: boolean;
  isFuture: boolean;
  onTypeTap: (anchorY: number, anchorX: number) => void;
  onComplete: () => void;
}) {
  const store = useWorkoutStore();
  const typeRef = useRef<View>(null);
  const label = SHORT_LABELS[set.setType];

  const glowOpacity = useSharedValue(0);
  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      glowOpacity.value = 0;
    }
  }, [isActive, glowOpacity]);

  const activeGlow = useAnimatedStyle(() => {
    if (!isActive) return {};
    return {
      borderColor: `rgba(255, 45, 85, ${0.3 + glowOpacity.value * 0.5})`,
      shadowOpacity: glowOpacity.value * 0.3,
    };
  });

  const rowBase = isActive ? $.rowActive : set.isCompleted ? $.rowCompleted : $.rowFuture;

  return (
    <Animated.View style={[$.row, rowBase, isFuture && { opacity: 0.5 }, isActive && activeGlow]}>
      {/* Left accent bar (active only) */}
      {isActive && <View style={$.activeAccent} />}

      {/* SET icon + label */}
      <Pressable
        ref={typeRef}
        onPress={() => {
          typeRef.current?.measureInWindow((x, y, w, h) => {
            onTypeTap(y + h + 4, x);
          });
        }}
        style={$.setCol}
      >
        <SetTypeIcon type={set.setType} size={28} />
        <Text style={[$.setLabel, { color: SET_TYPES[set.setType].color }]}>{label}</Text>
      </Pressable>

      {/* PREV */}
      <View style={$.prevCol}>
        {set.isCompleted ? (
          <>
            <Text style={$.prevW}>{set.weight}</Text>
            <Text style={$.prevR}>× {set.reps}</Text>
          </>
        ) : set.ghostWeight ? (
          <>
            <Text style={$.prevW}>{set.ghostWeight}</Text>
            <Text style={$.prevR}>× {set.ghostReps}</Text>
          </>
        ) : (
          <Text style={$.prevDash}>—</Text>
        )}
      </View>

      {/* LBS */}
      <View style={$.inputCol}>
        <TextInput
          style={[$.input, isActive && $.inputActive, set.isCompleted && $.inputDone]}
          value={set.weight > 0 ? String(set.weight) : ''}
          onChangeText={(t) => store.updateSet(exIdx, set.id, { weight: parseInt(t, 10) || 0 })}
          placeholder={isActive ? '' : '-'}
          placeholderTextColor="rgba(255,255,255,0.1)"
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!set.isCompleted}
        />
      </View>

      {/* REPS */}
      <View style={$.inputCol}>
        <TextInput
          style={[$.input, isActive && $.inputActive, set.isCompleted && $.inputDone]}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(t) => store.updateSet(exIdx, set.id, { reps: parseInt(t, 10) || 0 })}
          placeholder={isActive ? '' : '-'}
          placeholderTextColor="rgba(255,255,255,0.1)"
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!set.isCompleted}
        />
      </View>

      {/* CHECK */}
      <Pressable onPress={onComplete} style={$.checkCol} hitSlop={6}>
        {set.isCompleted ? (
          <View style={$.checkDone}>
            <FontAwesome name="check" size={13} color="#22c55e" />
          </View>
        ) : isActive ? (
          <View style={$.checkActive} />
        ) : (
          <View style={$.checkFuture} />
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════
   STYLES — 1:1 from HTML spec
   ═══════════════════════════════════════════════════ */
const $ = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { color: '#999', fontSize: 16 },

  /* HEADER — glass panel */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  headerSub: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  timerText: { color: '#999', fontSize: 11, fontWeight: '500' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#444' },
  exCounter: { color: '#ff2d55', fontSize: 11, fontWeight: '700' },
  headerBoltWrap: { width: 40 },
  headerBoltBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* BODY */
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 140 },

  /* Exercise info */
  exInfo: { marginBottom: 20, paddingHorizontal: 4 },
  exName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  exBadges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* SET TABLE CARD — glass panel */
  card: {
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 20,
    overflow: 'hidden',
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  colH: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },

  /* ROW — base */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  rowCompleted: {
    backgroundColor: 'rgba(28,28,30,0.5)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowActive: {
    backgroundColor: 'rgba(255,45,85,0.08)',
    borderColor: 'rgba(255,45,85,0.3)',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
    paddingVertical: 14,
  },
  rowFuture: {
    backgroundColor: '#1c1c1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeAccent: {
    position: 'absolute',
    left: -1,
    top: '50%',
    width: 3,
    height: 48,
    backgroundColor: '#ff2d55',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -24,
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  /* SET column */
  setCol: { width: 44, alignItems: 'center', justifyContent: 'center' },
  setLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  /* PREV column */
  prevCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  prevW: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  prevR: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  prevDash: { color: '#444', fontSize: 12, fontWeight: '500' },

  /* INPUT column */
  inputCol: { flex: 1, alignItems: 'center' },
  input: {
    width: '85%',
    height: 40,
    backgroundColor: '#151517',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 0,
  },
  inputActive: {
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,45,85,0.4)',
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  inputDone: {
    backgroundColor: 'rgba(44,44,46,0.5)',
    color: '#94a3b8',
  },

  /* CHECK column */
  checkCol: { width: 44, alignItems: 'center', justifyContent: 'center' },
  checkDone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  checkFuture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  /* ADD SET */
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addSetText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* UP NEXT */
  upNextWrap: { marginTop: 32, paddingHorizontal: 8 },
  upNextLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    gap: 16,
  },
  upNextAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(59,130,246,0.5)',
  },
  upNextName: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  upNextMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upNextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  upNextBadgeText: {
    color: '#60a5fa',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  upNextSets: { color: '#999', fontSize: 10 },
  upNextChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* FOOTER */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2c2c2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* Exercise action buttons */
  exActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  exActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  exActionText: { color: '#999', fontSize: 11, fontWeight: '600' },

  /* Quick-Swap modal */
  swapTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  swapSub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  swapSearch: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  swapRowName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  swapRowMeta: { color: '#777', fontSize: 11, marginTop: 2 },
});
