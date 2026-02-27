import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, BottomSheetModal } from '@/components/ui';
import { haptics } from '@/lib/haptics';

interface RPEModalProps {
  visible: boolean;
  exerciseName: string;
  completedSetsCount: number;
  onSubmit: (rpe: number, muscleConnection: number, notes: string) => void;
  onSkip: () => void;
}

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

function getRPEColor(rpe: number): string {
  if (rpe <= 7) return Colors.success;
  if (rpe <= 8) return Colors.warning;
  return Colors.accent;
}

function getRPELabel(rpe: number): string {
  if (rpe <= 6.5) return 'Very Easy';
  if (rpe <= 7.5) return 'Moderate';
  if (rpe <= 8.5) return 'Hard';
  if (rpe <= 9.5) return 'Very Hard';
  return 'Maximum Effort';
}

export function RPEModal({
  visible,
  exerciseName,
  completedSetsCount,
  onSubmit,
  onSkip,
}: RPEModalProps) {
  const [rpe, setRpe] = useState(8);
  const [muscleConnection, setMuscleConnection] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = useCallback(() => {
    haptics.success();
    onSubmit(rpe, muscleConnection, notes);
    setRpe(8);
    setMuscleConnection(3);
    setNotes('');
  }, [rpe, muscleConnection, notes, onSubmit]);

  const handleSkip = useCallback(() => {
    haptics.light();
    onSkip();
    setRpe(8);
    setMuscleConnection(3);
    setNotes('');
  }, [onSkip]);

  return (
    <BottomSheetModal visible={visible} onClose={handleSkip}>
      {/* Exercise context chip */}
      <View style={s.exerciseChip}>
        <FontAwesome name="check-circle" size={14} color={Colors.success} />
        <Text style={s.exerciseChipText}>
          {exerciseName} · {completedSetsCount} set{completedSetsCount !== 1 ? 's' : ''} done
        </Text>
      </View>

      <Text style={s.title}>How was that exercise?</Text>

      {/* ── RPE Slider ───────────────────────────── */}
      <Text style={s.sectionLabel}>RPE (Rate of Perceived Exertion)</Text>
      <View style={s.rpeValueRow}>
        <Text style={[s.rpeValue, { color: getRPEColor(rpe) }]}>{rpe}</Text>
        <Text style={[s.rpeLabel, { color: getRPEColor(rpe) }]}>{getRPELabel(rpe)}</Text>
      </View>

      <View style={s.rpeTrack}>
        {RPE_VALUES.map((val) => {
          const isActive = val <= rpe;
          const isSelected = val === rpe;
          return (
            <Pressable
              key={val}
              onPress={() => {
                haptics.selection();
                setRpe(val);
              }}
              style={s.rpeTouchArea}
            >
              <View
                style={[
                  s.rpeSegment,
                  isActive && { backgroundColor: getRPEColor(val) },
                  isSelected && s.rpeSegmentSelected,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={s.rpeLabelsRow}>
        <Text style={s.rpeEndLabel}>6</Text>
        <Text style={s.rpeEndLabel}>10</Text>
      </View>

      {/* ── Muscle Connection Stars ──────────────── */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>Muscle Connection</Text>
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              haptics.selection();
              setMuscleConnection(star);
            }}
            style={s.starTouch}
          >
            <FontAwesome
              name={star <= muscleConnection ? 'star' : 'star-o'}
              size={32}
              color={star <= muscleConnection ? Colors.warning : Colors.surfaceBorder}
            />
          </Pressable>
        ))}
      </View>
      <Text style={s.starLabel}>
        {muscleConnection <= 2
          ? 'Weak connection'
          : muscleConnection <= 3
            ? 'Moderate'
            : muscleConnection <= 4
              ? 'Strong connection'
              : 'Perfect mind-muscle'}
      </Text>

      {/* ── Notes ────────────────────────────────── */}
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>Notes (Optional)</Text>
      <TextInput
        style={s.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="How did that exercise feel?"
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={2}
      />

      {/* ── Actions ──────────────────────────────── */}
      <View style={s.actions}>
        <Button
          title="Save Feedback"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
        />
        <Pressable onPress={handleSkip} style={s.skipBtn}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: Colors.success + '14',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  exerciseChipText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },

  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  rpeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'center',
  },
  rpeValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  rpeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  rpeTrack: {
    flexDirection: 'row',
    gap: 4,
    height: 36,
    alignItems: 'flex-end',
  },
  rpeTouchArea: {
    flex: 1,
    height: 36,
    justifyContent: 'flex-end',
  },
  rpeSegment: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceBorder,
  },
  rpeSegmentSelected: {
    height: 14,
  },
  rpeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rpeEndLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starTouch: {
    padding: 4,
  },
  starLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  notesInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    textAlignVertical: 'top',
  },

  actions: {
    marginTop: 24,
    gap: 8,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
});
