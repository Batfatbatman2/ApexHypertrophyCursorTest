import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthStore } from '@/stores/auth-store';
import { seedAIProfile } from '@/lib/ai/seed-profile';
import type { TrainingAge, TrainingGoal, EquipmentAccess, Gender } from '@/stores/onboarding-store';

const STEP_TITLES = [
  'Welcome',
  'Experience Level',
  'Training Goal',
  'Equipment',
  'About You',
  'Bodyweight',
  'Schedule',
  'Injuries',
];

export default function OnboardingScreen() {
  const store = useOnboardingStore();
  const { completeOnboarding } = useAuthStore();
  const { currentStep, totalSteps } = store;
  const progress = (currentStep + 1) / totalSteps;

  const canAdvance = validateStep(currentStep, store);

  const handleNext = () => {
    haptics.light();
    if (currentStep === totalSteps - 1) {
      const profile = seedAIProfile(store.getData());
      // profile would be persisted to DB in production
      console.log('AI Profile seeded:', profile);
      completeOnboarding();
      router.replace('/(tabs)');
    } else {
      store.nextStep();
    }
  };

  const handleBack = () => {
    haptics.light();
    if (currentStep === 0) {
      router.back();
    } else {
      store.prevStep();
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ───────────────────────────────── */}
      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Colors.textSecondary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.stepLabel}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text style={s.stepTitle}>{STEP_TITLES[currentStep]}</Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {/* ── Progress Bar ─────────────────────────── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Step Content ─────────────────────────── */}
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 0 && <WelcomeStep />}
        {currentStep === 1 && <TrainingAgeStep />}
        {currentStep === 2 && <GoalStep />}
        {currentStep === 3 && <EquipmentStep />}
        {currentStep === 4 && <ProfileStep />}
        {currentStep === 5 && <BodyweightStep />}
        {currentStep === 6 && <ScheduleStep />}
        {currentStep === 7 && <InjuriesStep />}
      </ScrollView>

      {/* ── Footer ───────────────────────────────── */}
      <View style={s.footer}>
        <Button
          title={currentStep === totalSteps - 1 ? 'FINISH SETUP' : 'CONTINUE'}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canAdvance}
          onPress={handleNext}
        />
        {currentStep === 0 && (
          <Pressable
            style={s.skipAllBtn}
            onPress={() => {
              haptics.light();
              completeOnboarding();
              router.replace('/(tabs)');
            }}
          >
            <Text style={s.skipAllText}>Skip onboarding</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function validateStep(step: number, store: ReturnType<typeof useOnboardingStore.getState>) {
  switch (step) {
    case 0:
      return true;
    case 1:
      return store.trainingAge !== null;
    case 2:
      return store.goal !== null;
    case 3:
      return store.equipment !== null;
    case 4:
      return store.gender !== null;
    case 5:
      return true;
    case 6:
      return store.trainingDaysPerWeek >= 2;
    case 7:
      return true;
    default:
      return false;
  }
}

/* ═══════════════════════════════════════════════════
   Step 0: Welcome
   ═══════════════════════════════════════════════════ */
function WelcomeStep() {
  return (
    <View style={s.welcomeWrap}>
      <View style={s.welcomeIcon}>
        <FontAwesome name="bolt" size={48} color={Colors.accent} />
      </View>
      <Text style={s.welcomeTitle}>Welcome to Apex</Text>
      <Text style={s.welcomeSub}>
        Let's personalize your training experience. We'll ask a few questions to build your optimal
        program.
      </Text>
      <View style={s.welcomeFeatures}>
        {[
          { icon: 'line-chart' as const, text: 'AI-powered adaptive programming' },
          { icon: 'trophy' as const, text: 'Automatic PR detection' },
          { icon: 'calendar' as const, text: 'Smart volume tracking' },
        ].map((f) => (
          <View key={f.text} style={s.featureRow}>
            <View style={s.featureIconWrap}>
              <FontAwesome name={f.icon} size={14} color={Colors.accent} />
            </View>
            <Text style={s.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 1: Training Age
   ═══════════════════════════════════════════════════ */
function TrainingAgeStep() {
  const { trainingAge, setTrainingAge } = useOnboardingStore();

  const options: { id: TrainingAge; title: string; desc: string; icon: string }[] = [
    {
      id: 'beginner',
      title: 'Beginner',
      desc: 'Less than 1 year of consistent training',
      icon: '🌱',
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      desc: '1–3 years of structured training',
      icon: '💪',
    },
    {
      id: 'advanced',
      title: 'Advanced',
      desc: '3+ years, familiar with periodization',
      icon: '🔥',
    },
  ];

  return (
    <View>
      <Text style={s.questionText}>How long have you been training?</Text>
      <View style={s.optionsCol}>
        {options.map((o) => (
          <OptionCard
            key={o.id}
            title={o.title}
            desc={o.desc}
            icon={o.icon}
            selected={trainingAge === o.id}
            onPress={() => setTrainingAge(o.id)}
          />
        ))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 2: Goal
   ═══════════════════════════════════════════════════ */
function GoalStep() {
  const { goal, setGoal } = useOnboardingStore();

  const options: { id: TrainingGoal; title: string; desc: string }[] = [
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
      <Text style={s.questionText}>What's your primary training goal?</Text>
      <View style={s.optionsCol}>
        {options.map((o) => (
          <OptionCard
            key={o.id}
            title={o.title}
            desc={o.desc}
            selected={goal === o.id}
            onPress={() => setGoal(o.id)}
          />
        ))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 3: Equipment
   ═══════════════════════════════════════════════════ */
function EquipmentStep() {
  const { equipment, setEquipment } = useOnboardingStore();

  const options: { id: EquipmentAccess; title: string; desc: string; icon: string }[] = [
    {
      id: 'full_gym',
      title: 'Full Gym',
      desc: 'Barbells, dumbbells, cables, machines',
      icon: '🏋️',
    },
    {
      id: 'home_gym',
      title: 'Home Gym',
      desc: 'Adjustable dumbbells, bench, pull-up bar',
      icon: '🏠',
    },
    {
      id: 'bodyweight',
      title: 'Bodyweight Only',
      desc: 'No equipment, bodyweight exercises',
      icon: '🤸',
    },
  ];

  return (
    <View>
      <Text style={s.questionText}>What equipment do you have access to?</Text>
      <View style={s.optionsCol}>
        {options.map((o) => (
          <OptionCard
            key={o.id}
            title={o.title}
            desc={o.desc}
            icon={o.icon}
            selected={equipment === o.id}
            onPress={() => setEquipment(o.id)}
          />
        ))}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 4: Age + Gender
   ═══════════════════════════════════════════════════ */
function ProfileStep() {
  const { age, setAge, gender, setGender } = useOnboardingStore();

  const genderOptions: { id: Gender; label: string }[] = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'other', label: 'Other' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <View>
      <Text style={s.questionText}>Tell us about yourself</Text>

      <Text style={s.fieldLabel}>Age</Text>
      <View style={s.ageInputWrap}>
        <TextInput
          style={s.ageInput}
          value={age ? String(age) : ''}
          onChangeText={(t) => setAge(parseInt(t, 10) || 0)}
          placeholder="25"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={s.ageUnit}>years</Text>
      </View>

      <Text style={[s.fieldLabel, { marginTop: 28 }]}>Gender</Text>
      <View style={s.genderRow}>
        {genderOptions.map((g) => {
          const active = gender === g.id;
          return (
            <Pressable
              key={g.id}
              style={[s.genderPill, active && s.genderPillActive]}
              onPress={() => {
                haptics.selection();
                setGender(g.id);
              }}
            >
              <Text style={[s.genderText, active && s.genderTextActive]}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 5: Bodyweight
   ═══════════════════════════════════════════════════ */
function BodyweightStep() {
  const { bodyweight, setBodyweight, weightUnit, setWeightUnit } = useOnboardingStore();

  return (
    <View>
      <Text style={s.questionText}>What's your current bodyweight?</Text>
      <Text style={s.questionSub}>
        This helps us calculate relative strength and volume targets
      </Text>

      <View style={s.unitToggleRow}>
        {(['lbs', 'kg'] as const).map((u) => {
          const active = weightUnit === u;
          return (
            <Pressable
              key={u}
              onPress={() => {
                haptics.selection();
                setWeightUnit(u);
              }}
              style={[s.unitBtn, active && s.unitBtnActive]}
            >
              <Text style={[s.unitText, active && s.unitTextActive]}>{u.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.weightInputWrap}>
        <TextInput
          style={s.weightInput}
          value={bodyweight ? String(bodyweight) : ''}
          onChangeText={(t) => setBodyweight(parseInt(t, 10) || 0)}
          placeholder={weightUnit === 'lbs' ? '180' : '82'}
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Text style={s.weightUnitLabel}>{weightUnit}</Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 6: Training Days
   ═══════════════════════════════════════════════════ */
function ScheduleStep() {
  const { trainingDaysPerWeek, setTrainingDaysPerWeek } = useOnboardingStore();

  return (
    <View>
      <Text style={s.questionText}>How many days per week can you train?</Text>
      <Text style={s.questionSub}>We'll build your program around this schedule</Text>

      <View style={s.daysRow}>
        {[2, 3, 4, 5, 6, 7].map((d) => {
          const active = trainingDaysPerWeek === d;
          return (
            <Pressable
              key={d}
              onPress={() => {
                haptics.selection();
                setTrainingDaysPerWeek(d);
              }}
              style={[s.dayBtn, active && s.dayBtnActive]}
            >
              <Text style={[s.dayNum, active && s.dayNumActive]}>{d}</Text>
              <Text style={[s.dayLabel2, active && s.dayLabel2Active]}>days</Text>
            </Pressable>
          );
        })}
      </View>

      <Card padding={16} style={s.scheduleHint}>
        <Text style={s.hintTitle}>
          {trainingDaysPerWeek <= 3
            ? 'Full Body Recommended'
            : trainingDaysPerWeek <= 5
              ? 'Upper/Lower or PPL Split'
              : 'PPL or Bro Split'}
        </Text>
        <Text style={s.hintDesc}>
          {trainingDaysPerWeek <= 3
            ? 'With fewer training days, full body sessions maximize frequency per muscle group.'
            : trainingDaysPerWeek <= 5
              ? 'This allows optimal volume distribution across push, pull, and leg days.'
              : 'More days allows for greater specialization and targeted volume per muscle.'}
        </Text>
      </Card>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Step 7: Injuries
   ═══════════════════════════════════════════════════ */
const INJURY_OPTIONS = [
  'Lower back',
  'Shoulders',
  'Knees',
  'Elbows',
  'Wrists',
  'Hips',
  'Neck',
  'Ankles',
];

function InjuriesStep() {
  const { injuries, toggleInjury } = useOnboardingStore();

  return (
    <View>
      <Text style={s.questionText}>Any current injuries or pain areas?</Text>
      <Text style={s.questionSub}>
        We'll avoid movements that stress these areas. Select all that apply, or skip if none.
      </Text>

      <View style={s.injuryGrid}>
        {INJURY_OPTIONS.map((inj) => {
          const active = injuries.includes(inj);
          return (
            <Pressable
              key={inj}
              onPress={() => {
                haptics.selection();
                toggleInjury(inj);
              }}
              style={[s.injuryChip, active && s.injuryChipActive]}
            >
              <Text style={[s.injuryText, active && s.injuryTextActive]}>{inj}</Text>
              {active && <FontAwesome name="check" size={12} color={Colors.accent} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════
   Shared: OptionCard
   ═══════════════════════════════════════════════════ */
function OptionCard({
  title,
  desc,
  icon,
  selected,
  onPress,
}: {
  title: string;
  desc: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={[s.optionCard, selected && s.optionCardSelected]}
    >
      <View style={s.optionContent}>
        {icon && <Text style={s.optionIcon}>{icon}</Text>}
        <View style={s.optionText}>
          <Text style={[s.optionTitle, selected && s.optionTitleSelected]}>{title}</Text>
          <Text style={s.optionDesc}>{desc}</Text>
        </View>
      </View>
      {selected && (
        <View style={s.checkCircle}>
          <FontAwesome name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { color: Colors.textTertiary, fontSize: 12, fontWeight: '600' },
  stepTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 2 },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },

  footer: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 12 },
  skipAllBtn: { alignItems: 'center', paddingVertical: 14 },
  skipAllText: { color: Colors.textTertiary, fontSize: 14 },

  questionText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  questionSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  /* Option Card */
  optionsCol: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionCardSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(255, 45, 45, 0.06)' },
  optionContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  optionIcon: { fontSize: 28, marginRight: 14 },
  optionText: { flex: 1 },
  optionTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  optionTitleSelected: { color: Colors.accent },
  optionDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* Welcome */
  welcomeWrap: { alignItems: 'center', paddingTop: 24 },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 45, 45, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  welcomeSub: {
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 12,
  },
  welcomeFeatures: { width: '100%', gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 45, 45, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },

  /* Profile step */
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  ageInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: 100,
    paddingVertical: 14,
  },
  ageUnit: { color: Colors.textSecondary, fontSize: 16 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genderPill: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderPillActive: { borderColor: Colors.accent, backgroundColor: 'rgba(255, 45, 45, 0.06)' },
  genderText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  genderTextActive: { color: Colors.accent },

  /* Bodyweight step */
  unitToggleRow: { flexDirection: 'row', gap: 0, marginBottom: 28, alignSelf: 'center' },
  unitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  unitBtnActive: { backgroundColor: Colors.accent },
  unitText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
  unitTextActive: { color: '#FFFFFF' },
  weightInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  weightInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    width: 160,
    paddingVertical: 20,
  },
  weightUnitLabel: { color: Colors.textSecondary, fontSize: 20, fontWeight: '600' },

  /* Schedule step */
  daysRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  dayBtn: {
    width: 52,
    height: 68,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayBtnActive: { borderColor: Colors.accent, backgroundColor: 'rgba(255, 45, 45, 0.08)' },
  dayNum: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  dayNumActive: { color: Colors.accent },
  dayLabel2: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600', marginTop: 2 },
  dayLabel2Active: { color: Colors.accent },
  scheduleHint: { marginBottom: 8 },
  hintTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  hintDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },

  /* Injuries step */
  injuryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  injuryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  injuryChipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(255, 45, 45, 0.06)' },
  injuryText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  injuryTextActive: { color: Colors.accent },
});
