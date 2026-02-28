import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';
import { useReadinessStore } from '@/stores/readiness-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const METRICS: {
  key: 'soreness' | 'sleepQuality' | 'stressLevel' | 'energyLevel';
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
}[] = [
  {
    key: 'soreness',
    label: 'Muscle Soreness',
    icon: 'heartbeat',
    color: '#EF4444',
    lowLabel: 'None',
    highLabel: 'Severe',
    inverted: true,
  },
  {
    key: 'sleepQuality',
    label: 'Sleep Quality',
    icon: 'moon-o',
    color: '#8B5CF6',
    lowLabel: 'Terrible',
    highLabel: 'Amazing',
  },
  {
    key: 'stressLevel',
    label: 'Stress Level',
    icon: 'bolt',
    color: '#F59E0B',
    lowLabel: 'Calm',
    highLabel: 'Very High',
    inverted: true,
  },
  {
    key: 'energyLevel',
    label: 'Energy Level',
    icon: 'fire',
    color: '#22C55E',
    lowLabel: 'Exhausted',
    highLabel: 'Energized',
  },
];

export function ReadinessSurvey({ visible, onClose }: Props) {
  const { addEntry } = useReadinessStore();
  const [values, setValues] = useState({
    soreness: 2,
    sleepQuality: 3,
    stressLevel: 2,
    energyLevel: 3,
  });
  const [notes, setNotes] = useState('');

  const handleSubmit = useCallback(() => {
    haptics.success();
    addEntry({ ...values, notes });
    setNotes('');
    onClose();
  }, [addEntry, values, notes, onClose]);

  const setVal = useCallback((key: keyof typeof values, val: number) => {
    haptics.selection();
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  if (!visible) return null;

  const score = Math.round(
    ((5 - values.soreness + values.sleepQuality + (5 - values.stressLevel) + values.energyLevel) /
      20) *
      100,
  );
  const scoreColor = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.root}>
        <View style={s.header}>
          <View style={{ width: 40 }} />
          <Text style={s.headerTitle}>Daily Check-in</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <FontAwesome name="close" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Preview */}
          <View style={s.scoreCard}>
            <Text style={[s.scoreValue, { color: scoreColor }]}>{score}%</Text>
            <Text style={s.scoreLabel}>Readiness Score</Text>
          </View>

          {/* Metric Sliders */}
          {METRICS.map((m) => (
            <View key={m.key} style={s.metricCard}>
              <View style={s.metricHeader}>
                <View style={[s.metricIconWrap, { backgroundColor: m.color + '18' }]}>
                  <FontAwesome name={m.icon} size={14} color={m.color} />
                </View>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={[s.metricValue, { color: m.color }]}>{values[m.key]}/5</Text>
              </View>
              <View style={s.sliderRow}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const active = values[m.key] >= v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setVal(m.key, v)}
                      style={[s.sliderDot, active && { backgroundColor: m.color }]}
                    />
                  );
                })}
              </View>
              <View style={s.sliderLabels}>
                <Text style={s.sliderLabelText}>{m.lowLabel}</Text>
                <Text style={s.sliderLabelText}>{m.highLabel}</Text>
              </View>
            </View>
          ))}

          {/* Notes */}
          <View style={s.notesCard}>
            <Text style={s.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={s.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling today?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={s.footer}>
          <Pressable onPress={handleSubmit} style={s.submitBtn}>
            <Text style={s.submitBtnText}>Save Check-in</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  scoreValue: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  scoreLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 4 },

  metricCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  metricValue: { fontSize: 14, fontWeight: '700' },

  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  sliderDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
  },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600' },

  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  notesLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  notesInput: {
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
  },

  footer: { padding: 20, borderTopWidth: 0.5, borderTopColor: Colors.divider },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
