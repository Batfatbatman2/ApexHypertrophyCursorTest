import React, { useState, useCallback } from 'react';
import { TextInput, Text, StyleSheet, Pressable } from 'react-native';

import { Colors } from '@/constants/Colors';
import { haptics } from '@/lib/haptics';

interface NumericInputProps {
  value: number;
  onChangeValue: (val: number) => void;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function NumericInput({
  value,
  onChangeValue,
  label,
  placeholder = '0',
  min = 0,
  max = 9999,
}: NumericInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      const num = parseInt(text, 10);
      if (isNaN(num)) {
        onChangeValue(0);
      } else {
        onChangeValue(Math.max(min, Math.min(max, num)));
      }
    },
    [onChangeValue, min, max],
  );

  return (
    <Pressable
      style={[styles.container, focused && styles.containerFocused]}
      onPress={() => haptics.selection()}
    >
      <TextInput
        style={styles.input}
        value={value > 0 ? String(value) : ''}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType="number-pad"
        selectTextOnFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: Colors.accent,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 48,
    padding: 0,
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
