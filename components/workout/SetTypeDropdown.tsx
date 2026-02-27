import { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SET_TYPES, type SetType } from '@/constants/set-types';
import { SetTypeIcon } from './SetTypeIcon';
import { haptics } from '@/lib/haptics';

const SET_TYPE_ORDER: SetType[] = ['warmup', 'working', 'dropSet', 'myoRep'];

interface SetTypeDropdownProps {
  visible: boolean;
  currentType: SetType;
  anchorY: number;
  anchorX: number;
  onSelect: (type: SetType) => void;
  onClose: () => void;
}

export function SetTypeDropdown({
  visible,
  currentType,
  anchorY,
  anchorX,
  onSelect,
  onClose,
}: SetTypeDropdownProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.9, { duration: 100 });
    }
  }, [visible, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleSelect = useCallback(
    (type: SetType) => {
      haptics.selection();
      onSelect(type);
    },
    [onSelect],
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.dropdown,
            animStyle,
            {
              top: anchorY,
              left: Math.max(8, Math.min(anchorX - 80, 200)),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Set Type</Text>
          </View>
          {SET_TYPE_ORDER.map((type) => {
            const cfg = SET_TYPES[type];
            const isSelected = type === currentType;
            return (
              <Pressable
                key={type}
                onPress={() => handleSelect(type)}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <SetTypeIcon type={type} size={28} />
                <Text
                  style={[
                    styles.label,
                    { color: isSelected ? cfg.color : '#999' },
                    isSelected && styles.labelSelected,
                  ]}
                >
                  {cfg.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    width: 170,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 30,
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
  headerText: {
    color: '#555',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 1,
  },
  rowSelected: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelSelected: {
    fontWeight: '700',
  },
});
