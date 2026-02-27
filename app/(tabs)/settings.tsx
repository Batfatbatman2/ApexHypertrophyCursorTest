import { ScrollView, Text, View, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useSettingsStore } from '@/stores/settings-store';

export default function SettingsScreen() {
  const {
    weightUnit,
    setWeightUnit,
    autoStartTimer,
    setAutoStartTimer,
    hapticsEnabled,
    setHapticsEnabled,
  } = useSettingsStore();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Settings</Text>

        {/* ── Profile Card ───────────────────────────── */}
        <Card variant="elevated" padding={16} style={s.profileCard}>
          <View style={s.avatarCircle}>
            <FontAwesome name="user" size={22} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>Athlete</Text>
            <Text style={s.profileEmail}>Set up your profile</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
        </Card>

        {/* ── Units ──────────────────────────────────── */}
        <SectionLabel title="Units" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Weight Unit" icon="balance-scale" isLast>
            <View style={s.unitToggle}>
              {(['lbs', 'kg'] as const).map((unit) => {
                const active = weightUnit === unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      haptics.selection();
                      setWeightUnit(unit);
                    }}
                    style={[
                      s.unitBtn,
                      unit === 'lbs' && s.unitBtnLeft,
                      unit === 'kg' && s.unitBtnRight,
                      active && s.unitBtnActive,
                    ]}
                  >
                    <Text style={[s.unitBtnText, active && s.unitBtnTextActive]}>
                      {unit.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingRow>
        </Card>

        {/* ── Rest Timer ─────────────────────────────── */}
        <SectionLabel title="Rest Timer" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Default Duration" icon="clock-o">
            <Text style={s.settingValue}>90s</Text>
          </SettingRow>
          <SettingRow label="Auto-Start Timer" icon="play-circle" isLast>
            <Switch
              value={autoStartTimer}
              onValueChange={(v) => {
                haptics.selection();
                setAutoStartTimer(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </Card>

        {/* ── General ────────────────────────────────── */}
        <SectionLabel title="General" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Haptic Feedback" icon="hand-pointer-o">
            <Switch
              value={hapticsEnabled}
              onValueChange={(v) => {
                haptics.selection();
                setHapticsEnabled(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
          <SettingRow label="Theme" icon="moon-o">
            <Text style={s.settingValue}>Dark</Text>
          </SettingRow>
          <SettingRow label="Notifications" icon="bell-o" isLast>
            <Text style={s.settingValue}>On</Text>
          </SettingRow>
        </Card>

        {/* ── Data ───────────────────────────────────── */}
        <SectionLabel title="Data" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Export Data" icon="download" chevron />
          <SettingRow label="Delete All My Data" icon="trash-o" danger isLast chevron />
        </Card>

        <Text style={s.version}>Apex Hypertrophy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title}</Text>;
}

function SettingRow({
  label,
  icon,
  children,
  isLast,
  danger,
  chevron,
}: {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  children?: React.ReactNode;
  isLast?: boolean;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <View style={[s.settingRow, !isLast && s.settingRowBorder]}>
      {icon && (
        <View style={s.settingIcon}>
          <FontAwesome name={icon} size={14} color={danger ? Colors.error : Colors.textTertiary} />
        </View>
      )}
      <Text style={[s.settingLabel, danger && { color: Colors.error }]}>{label}</Text>
      <View style={s.settingRight}>
        {children}
        {chevron && (
          <FontAwesome
            name="chevron-right"
            size={11}
            color={danger ? Colors.error : Colors.textTertiary}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  profileEmail: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },

  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  group: { marginBottom: 24 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  settingIcon: { width: 24, alignItems: 'center' },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { color: Colors.textSecondary, fontSize: 14 },

  unitToggle: { flexDirection: 'row' },
  unitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    backgroundColor: Colors.surfaceLight,
  },
  unitBtnLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  unitBtnRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  unitBtnActive: { backgroundColor: Colors.accent },
  unitBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  unitBtnTextActive: { color: '#FFFFFF' },

  version: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
