import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { Card, BottomSheetModal } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useSettingsStore, type ThemeMode } from '@/stores/settings-store';
import { useAuthStore } from '@/stores/auth-store';

const REST_PRESETS = [30, 60, 90, 120, 180, 240];

function fmtDuration(s: number) {
  return s >= 60 ? `${s / 60}m` : `${s}s`;
}

const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}[] = [
  { value: 'dark', label: 'Dark', icon: 'moon-o' },
  { value: 'light', label: 'Light', icon: 'sun-o' },
  { value: 'system', label: 'System', icon: 'cog' },
];

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const { signOut } = useAuthStore();
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleDelete = useCallback(() => {
    settings.resetAllSettings();
    setShowDeleteConfirm(false);
    haptics.success();
  }, [settings]);

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
            <SegmentedToggle
              options={['lbs', 'kg']}
              value={settings.weightUnit}
              onSelect={(v) => {
                haptics.selection();
                settings.setWeightUnit(v as 'lbs' | 'kg');
              }}
            />
          </SettingRow>
        </Card>

        {/* ── Rest Timer ─────────────────────────────── */}
        <SectionLabel title="Rest Timer" />
        <Card padding={0} style={s.group}>
          <SettingRow
            label="Default Duration"
            icon="clock-o"
            onPress={() => {
              haptics.light();
              setShowRestPicker(true);
            }}
          >
            <Text style={s.settingValueAccent}>{fmtDuration(settings.defaultRestDuration)}</Text>
            <FontAwesome name="chevron-right" size={11} color={Colors.textTertiary} />
          </SettingRow>
          <SettingRow label="Auto-Start Timer" icon="play-circle" isLast>
            <Switch
              value={settings.autoStartTimer}
              onValueChange={(v) => {
                haptics.selection();
                settings.setAutoStartTimer(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </Card>

        {/* ── Appearance ───────────────────────────────── */}
        <SectionLabel title="Appearance" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Theme" icon="moon-o" isLast>
            <View style={s.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = settings.theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      haptics.selection();
                      settings.setTheme(opt.value);
                    }}
                    style={[s.themePill, active && s.themePillActive]}
                  >
                    <FontAwesome
                      name={opt.icon}
                      size={12}
                      color={active ? '#fff' : Colors.textTertiary}
                    />
                    <Text style={[s.themePillText, active && s.themePillTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingRow>
        </Card>

        {/* ── General ────────────────────────────────── */}
        <SectionLabel title="General" />
        <Card padding={0} style={s.group}>
          <SettingRow label="Haptic Feedback" icon="hand-pointer-o">
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => {
                haptics.selection();
                settings.setHapticsEnabled(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
          <SettingRow label="Notifications" icon="bell-o" isLast>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => {
                haptics.selection();
                settings.setNotificationsEnabled(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </Card>

        {/* ── Volume Targets ─────────────────────────── */}
        <SectionLabel title="Volume Targets" />
        <Card padding={0} style={s.group}>
          <Pressable
            onPress={() => {
              haptics.light();
              setShowVolume(!showVolume);
            }}
            style={s.volumeToggleRow}
          >
            <View style={s.settingIcon}>
              <FontAwesome name="bar-chart" size={14} color={Colors.textTertiary} />
            </View>
            <Text style={s.settingLabel}>Weekly Sets per Muscle</Text>
            <FontAwesome
              name={showVolume ? 'chevron-up' : 'chevron-down'}
              size={11}
              color={Colors.textTertiary}
            />
          </Pressable>
          {showVolume && (
            <View style={s.volumeList}>
              {MUSCLE_GROUPS.map((mg) => {
                const target = settings.volumeTargets[mg.id] ?? mg.defaultWeeklyTarget;
                return (
                  <View key={mg.id} style={s.volumeRow}>
                    <Text style={s.volumeName}>{mg.name}</Text>
                    <View style={s.stepper}>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          settings.setVolumeTarget(mg.id, target - 1);
                        }}
                        style={s.stepperBtn}
                      >
                        <FontAwesome name="minus" size={10} color={Colors.textSecondary} />
                      </Pressable>
                      <Text style={s.stepperValue}>{target}</Text>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          settings.setVolumeTarget(mg.id, target + 1);
                        }}
                        style={s.stepperBtn}
                      >
                        <FontAwesome name="plus" size={10} color={Colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              <Pressable
                onPress={() => {
                  haptics.medium();
                  settings.resetVolumeTargets();
                }}
                style={s.resetBtn}
              >
                <FontAwesome name="refresh" size={12} color={Colors.accent} />
                <Text style={s.resetBtnText}>Reset to Defaults</Text>
              </Pressable>
            </View>
          )}
        </Card>

        {/* ── Data ───────────────────────────────────── */}
        <SectionLabel title="Data" />
        <Card padding={0} style={s.group}>
          <SettingRow
            label="Export Data"
            icon="download"
            chevron
            onPress={() => {
              haptics.light();
              setShowExportModal(true);
            }}
          />
          <SettingRow
            label="Delete All My Data"
            icon="trash-o"
            danger
            isLast
            chevron
            onPress={() => {
              haptics.warning();
              setShowDeleteConfirm(true);
            }}
          />
        </Card>

        {/* ── Account ────────────────────────────────── */}
        <SectionLabel title="Account" />
        <Card padding={0} style={s.group}>
          <SettingRow
            label="Sign Out"
            icon="sign-out"
            isLast
            onPress={() => {
              haptics.medium();
              signOut();
            }}
          >
            <FontAwesome name="chevron-right" size={11} color={Colors.textTertiary} />
          </SettingRow>
        </Card>

        <Text style={s.version}>Apex Hypertrophy v1.0.0</Text>
      </ScrollView>

      {/* ── Rest Duration Picker Modal ────────────── */}
      <BottomSheetModal visible={showRestPicker} onClose={() => setShowRestPicker(false)}>
        <Text style={s.modalTitle}>Rest Timer Duration</Text>
        <Text style={s.modalSub}>Choose your default rest period between sets</Text>
        <View style={s.restGrid}>
          {REST_PRESETS.map((dur) => {
            const active = settings.defaultRestDuration === dur;
            return (
              <Pressable
                key={dur}
                onPress={() => {
                  haptics.selection();
                  settings.setDefaultRestDuration(dur);
                  setShowRestPicker(false);
                }}
                style={[s.restChip, active && s.restChipActive]}
              >
                <Text style={[s.restChipText, active && s.restChipTextActive]}>
                  {fmtDuration(dur)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>

      {/* ── Delete Confirmation Modal ─────────────── */}
      <BottomSheetModal visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <View style={s.deleteModal}>
          <View style={s.deleteIconCircle}>
            <FontAwesome name="exclamation-triangle" size={24} color={Colors.error} />
          </View>
          <Text style={s.deleteTitle}>Delete All Data?</Text>
          <Text style={s.deleteSub}>
            This will permanently remove all your workouts, programs, PRs, and settings. This action
            cannot be undone.
          </Text>
          <Pressable onPress={handleDelete} style={s.deleteBtnDanger}>
            <Text style={s.deleteBtnDangerText}>Delete Everything</Text>
          </Pressable>
          <Pressable onPress={() => setShowDeleteConfirm(false)} style={s.deleteBtnCancel}>
            <Text style={s.deleteBtnCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      {/* ── Export Modal ──────────────────────────── */}
      <BottomSheetModal visible={showExportModal} onClose={() => setShowExportModal(false)}>
        <View style={s.exportModal}>
          <Text style={s.modalTitle}>Export Data</Text>
          <Text style={s.modalSub}>Download your training data in your preferred format</Text>
          <Pressable
            onPress={() => {
              haptics.success();
              setShowExportModal(false);
            }}
            style={s.exportRow}
          >
            <View style={[s.exportIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <FontAwesome name="file-code-o" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.exportRowTitle}>JSON</Text>
              <Text style={s.exportRowSub}>Full data export for backup</Text>
            </View>
            <FontAwesome name="chevron-right" size={11} color={Colors.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => {
              haptics.success();
              setShowExportModal(false);
            }}
            style={s.exportRow}
          >
            <View style={[s.exportIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <FontAwesome name="file-pdf-o" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.exportRowTitle}>PDF Report</Text>
              <Text style={s.exportRowSub}>Printable training summary</Text>
            </View>
            <FontAwesome name="chevron-right" size={11} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

/* ── Reusable sub-components ─────────────────────────── */

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
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  children?: React.ReactNode;
  isLast?: boolean;
  danger?: boolean;
  chevron?: boolean;
  onPress?: () => void;
}) {
  const Row = onPress ? Pressable : View;
  return (
    <Row onPress={onPress} style={[s.settingRow, !isLast && s.settingRowBorder]}>
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
    </Row>
  );
}

function SegmentedToggle({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={s.segWrap}>
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              s.segBtn,
              i === 0 && s.segBtnLeft,
              i === options.length - 1 && s.segBtnRight,
              active && s.segBtnActive,
            ]}
          >
            <Text style={[s.segBtnText, active && s.segBtnTextActive]}>{opt.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

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

  /* Profile */
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

  /* Section */
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

  /* Setting row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  settingRowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.divider },
  settingIcon: { width: 24, alignItems: 'center' },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValueAccent: { color: Colors.accent, fontSize: 14, fontWeight: '700' },

  /* Segmented toggle */
  segWrap: { flexDirection: 'row' },
  segBtn: { paddingHorizontal: 18, paddingVertical: 7, backgroundColor: Colors.surfaceLight },
  segBtnLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  segBtnRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  segBtnActive: { backgroundColor: Colors.accent },
  segBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  segBtnTextActive: { color: '#FFFFFF' },

  /* Theme */
  themeRow: { flexDirection: 'row', gap: 6 },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  themePillActive: { backgroundColor: Colors.accent },
  themePillText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  themePillTextActive: { color: '#fff' },

  /* Volume targets */
  volumeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  volumeList: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.divider,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  volumeName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    backgroundColor: Colors.accent + '0A',
  },
  resetBtnText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  /* Rest picker modal */
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  restGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  restChip: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  restChipActive: { backgroundColor: Colors.accent + '18', borderColor: Colors.accent },
  restChipText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  restChipTextActive: { color: Colors.accent },

  /* Delete modal */
  deleteModal: { alignItems: 'center', paddingTop: 8 },
  deleteIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  deleteSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  deleteBtnDanger: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteBtnDangerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtnCancel: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  deleteBtnCancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },

  /* Export modal */
  exportModal: { paddingTop: 4 },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportRowTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  exportRowSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  /* Version */
  version: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
