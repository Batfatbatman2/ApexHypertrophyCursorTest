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
}[] = [{ value: 'dark', label: 'Dark', icon: 'moon-o' }];

/**
 * Redesigned Settings Screen
 * Matches the aesthetic of Home and Analytics screens
 * - Bold typography (34px title, 800 weight)
 * - Card-based layout with subtle elevation
 * - Accent color (#FF2D2D) for interactive elements
 * - Icon-forward design with visual hierarchy
 * - Quick stats row for at-a-glance info
 */
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
        {/* ── Header ───────────────────────────────────── */}
        <Text style={s.title}>Settings</Text>

        {/* ── Profile Section ──────────────────────────── */}
        <Card variant="elevated" padding={20} style={s.profileCard}>
          <View style={s.profileRow}>
            <View style={s.avatarContainer}>
              <View style={s.avatarCircle}>
                <FontAwesome name="user" size={24} color={Colors.accent} />
              </View>
              <View style={s.avatarRing} />
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>Athlete</Text>
              <Text style={s.profileEmail}>tap to customize</Text>
            </View>
            <View style={s.chevronContainer}>
              <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
            </View>
          </View>
        </Card>

        {/* ── Quick Stats Row ───────────────────────────── */}
        <View style={s.statsRow}>
          <Card variant="elevated" padding={16} style={s.statCard}>
            <FontAwesome name="clock-o" size={18} color={Colors.accent} />
            <Text style={s.statValue}>{fmtDuration(settings.defaultRestDuration)}</Text>
            <Text style={s.statLabel}>Rest</Text>
          </Card>
          <Card variant="elevated" padding={16} style={s.statCard}>
            <FontAwesome name="balance-scale" size={18} color={Colors.accent} />
            <Text style={s.statValue}>{settings.weightUnit.toUpperCase()}</Text>
            <Text style={s.statLabel}>Unit</Text>
          </Card>
          <Card variant="elevated" padding={16} style={s.statCard}>
            <FontAwesome name={settings.hapticsEnabled ? 'hand-pointer-o' : 'hand-stop-o'} size={18} color={Colors.accent} />
            <Text style={s.statValue}>{settings.hapticsEnabled ? 'On' : 'Off'}</Text>
            <Text style={s.statLabel}>Haptics</Text>
          </Card>
        </View>

        {/* ── Timer Settings ────────────────────────────── */}
        <Text style={s.sectionTitle}>Timer</Text>
        <Card padding={0} style={s.settingsGroup}>
          <SettingRow
            label="Default Rest Duration"
            icon="clock-o"
            onPress={() => {
              haptics.light();
              setShowRestPicker(true);
            }}
          >
            <Text style={s.settingValue}>{fmtDuration(settings.defaultRestDuration)}</Text>
            <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
          </SettingRow>
          <SettingRow label="Auto-Start Timer" icon="play-circle" isLast>
            <Switch
              value={settings.autoStartTimer}
              onValueChange={(v) => {
                haptics.selection();
                settings.setAutoStartTimer(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent + '99' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={Colors.surfaceLight}
            />
          </SettingRow>
        </Card>

        {/* ── Preferences ────────────────────────────────── */}
        <Text style={s.sectionTitle}>Preferences</Text>
        <Card padding={0} style={s.settingsGroup}>
          <SettingRow label="Weight Unit" icon="balance-scale">
            <SegmentedToggle
              options={['lbs', 'kg']}
              value={settings.weightUnit}
              onSelect={(v) => {
                haptics.selection();
                settings.setWeightUnit(v as 'lbs' | 'kg');
              }}
            />
          </SettingRow>
          <SettingRow label="Haptic Feedback" icon="hand-pointer-o">
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => {
                haptics.selection();
                settings.setHapticsEnabled(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent + '99' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={Colors.surfaceLight}
            />
          </SettingRow>
          <SettingRow label="Notifications" icon="bell-o" isLast>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => {
                haptics.selection();
                settings.setNotificationsEnabled(v);
              }}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent + '99' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={Colors.surfaceLight}
            />
          </SettingRow>
        </Card>

        {/* ── Appearance ────────────────────────────────── */}
        <Text style={s.sectionTitle}>Appearance</Text>
        <Card padding={0} style={s.settingsGroup}>
          <SettingRow label="Theme" icon="adjust" isLast>
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

        {/* ── Volume Targets ────────────────────────────── */}
        <Text style={s.sectionTitle}>Volume Targets</Text>
        <Card padding={0} style={s.settingsGroup}>
          <Pressable
            onPress={() => {
              haptics.light();
              setShowVolume(!showVolume);
            }}
            style={s.volumeToggle}
          >
            <View style={s.settingIconLarge}>
              <FontAwesome name="bar-chart" size={16} color={Colors.accent} />
            </View>
            <View style={s.volumeToggleContent}>
              <Text style={s.settingLabel}>Weekly Sets per Muscle</Text>
              <Text style={s.volumeToggleSub}>
                {Object.values(settings.volumeTargets).reduce((a, b) => a + b, 0)} total sets
              </Text>
            </View>
            <FontAwesome
              name={showVolume ? 'chevron-up' : 'chevron-down'}
              size={12}
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
                  haptics.light();
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

        {/* ── Data Management ───────────────────────────── */}
        <Text style={s.sectionTitle}>Data</Text>
        <Card padding={0} style={s.settingsGroup}>
          <SettingRow
            label="Export Data"
            icon="download"
            onPress={() => {
              haptics.light();
              setShowExportModal(true);
            }}
            chevron
          />
          <SettingRow
            label="Reset All Settings"
            icon="trash-o"
            danger
            onPress={() => {
              haptics.light();
              setShowDeleteConfirm(true);
            }}
            isLast
            chevron
          />
        </Card>

        {/* ── Version ──────────────────────────────────── */}
        <Text style={s.version}>Apex Hypertrophy v1.0.0</Text>
        <Text style={s.versionSub}>Made with 🔥 for gains</Text>

        {/* ── Modals ────────────────────────────────────── */}
        <BottomSheetModal
          visible={showRestPicker}
          onClose={() => setShowRestPicker(false)}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Default Rest Duration</Text>
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
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
        >
          <View style={s.modalContent}>
            <View style={s.modalIconCircle}>
              <FontAwesome name="trash" size={24} color={Colors.error} />
            </View>
            <Text style={s.modalTitle}>Reset all settings?</Text>
            <Text style={s.modalSub}>
              This will restore all settings to their default values. This action cannot be undone.
            </Text>
            <Pressable
              onPress={handleDelete}
              style={s.modalDangerBtn}
            >
              <Text style={s.modalDangerBtnText}>Reset Everything</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowDeleteConfirm(false)}
              style={s.modalCancelBtn}
            >
              <Text style={s.modalCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Export Data</Text>
            <Pressable style={s.exportRow}>
              <View style={[s.exportIcon, { backgroundColor: Colors.accent + '20' }]}>
                <FontAwesome name="file-pdf-o" size={20} color={Colors.accent} />
              </View>
              <View style={s.exportText}>
                <Text style={s.exportTitle}>Export as PDF</Text>
                <Text style={s.exportSub}>Generate a workout report</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
            </Pressable>
            <Pressable style={s.exportRow}>
              <View style={[s.exportIcon, { backgroundColor: Colors.accent + '20' }]}>
                <FontAwesome name="file-excel-o" size={20} color={Colors.accent} />
              </View>
              <View style={s.exportText}>
                <Text style={s.exportTitle}>Export as CSV</Text>
                <Text style={s.exportSub}>Download your workout history</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
            </Pressable>
            <Pressable style={[s.exportRow, { borderBottomWidth: 0 }]}>
              <View style={[s.exportIcon, { backgroundColor: Colors.accent + '20' }]}>
                <FontAwesome name="share-alt" size={20} color={Colors.accent} />
              </View>
              <View style={s.exportText}>
                <Text style={s.exportTitle}>Share Profile</Text>
                <Text style={s.exportSub}>Export your training data</Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </BottomSheetModal>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────── */

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
          <FontAwesome name={icon} size={16} color={danger ? Colors.error : Colors.textTertiary} />
        </View>
      )}
      <Text style={[s.settingLabel, danger && { color: Colors.error }]}>{label}</Text>
      <View style={s.settingRight}>
        {children}
        {chevron && (
          <FontAwesome
            name="chevron-right"
            size={12}
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
  content: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Header */
  title: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 24,
    letterSpacing: -0.5,
  },

  /* Section */
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  settingsGroup: { marginBottom: 8, overflow: 'hidden' },

  /* Profile Card */
  profileCard: { marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.accent,
    opacity: 0.3,
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  profileEmail: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  chevronContainer: { padding: 8 },

  /* Stats Row */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 8 },
  statLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 2 },

  /* Setting row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  settingIcon: { width: 24, alignItems: 'center' },
  settingIconLarge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, flex: 1, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { color: Colors.accent, fontSize: 15, fontWeight: '600' },

  /* Volume toggle */
  volumeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  volumeToggleContent: { flex: 1 },
  volumeToggleSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  volumeList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  volumeName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    backgroundColor: Colors.accent + '08',
  },
  resetBtnText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  /* Segmented toggle */
  segWrap: { flexDirection: 'row' },
  segBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surfaceLight },
  segBtnLeft: { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  segBtnRight: { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  segBtnActive: { backgroundColor: Colors.accent },
  segBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  segBtnTextActive: { color: '#FFFFFF' },

  /* Theme */
  themeRow: { flexDirection: 'row', gap: 8 },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  themePillActive: { backgroundColor: Colors.accent },
  themePillText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  themePillTextActive: { color: '#fff' },

  /* Modals */
  modalContent: { paddingBottom: 20 },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalDangerBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalDangerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  modalCancelBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },

  /* Rest picker */
  restGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  restChip: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  restChipActive: { backgroundColor: Colors.accent + '18', borderColor: Colors.accent },
  restChipText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  restChipTextActive: { color: Colors.accent },

  /* Export */
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: { flex: 1 },
  exportTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  exportSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  /* Version */
  version: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '600',
  },
  versionSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
