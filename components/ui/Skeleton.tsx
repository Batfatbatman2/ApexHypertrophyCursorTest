import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View
      style={[s.base, { width: width as number, height, borderRadius }, animStyle, style]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View style={s.card}>
      <Skeleton width={120} height={12} />
      <View style={{ height: 10 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Skeleton width={i === lines - 1 ? '60%' : '100%'} height={10} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={s.row}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="70%" height={12} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
});
