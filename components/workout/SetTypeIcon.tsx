import React from 'react';
import { View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SET_TYPES, type SetType } from '@/constants/set-types';

const ICON_SIZES: Record<string, number> = {
  fire: 14,
  bolt: 14,
  'chevron-down': 12,
  pause: 11,
};

interface SetTypeIconProps {
  type: SetType;
  size?: number;
}

export const SetTypeIcon = React.memo(function SetTypeIcon({ type, size = 32 }: SetTypeIconProps) {
  const cfg = SET_TYPES[type];
  const iconSize = ICON_SIZES[cfg.icon] ?? 13;
  const scaledIconSize = Math.round(iconSize * (size / 32));

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cfg.color + '18',
          borderColor: cfg.color + '30',
        },
      ]}
    >
      <FontAwesome name={cfg.icon} size={scaledIconSize} color={cfg.color} />
    </View>
  );
});

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
