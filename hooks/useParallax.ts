import { useSharedValue, useAnimatedScrollHandler, interpolate } from 'react-native-reanimated';

export interface ParallaxConfig {
  speed?: number;
  offset?: number;
}

export interface ParallaxStyle {
  transform: { translateY: number }[];
}

/**
 * Hook for creating parallax scroll effects
 */
export function useParallaxScroll(config: ParallaxConfig = {}) {
  const { speed = 0.5 } = config;

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const parallaxStyle = (translateSpeed: number = speed): ParallaxStyle => {
    'worklet';
    return {
      transform: [{ translateY: -(scrollY.value * translateSpeed) }],
    };
  };

  return {
    scrollHandler,
    scrollY,
    parallaxStyle,
  };
}

/**
 * Hook for creating scale-based parallax
 */
export function useScaleParallax() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getScaleStyle = (inputRange: number[], baseScale = 1) => {
    'worklet';
    const scale = interpolate(scrollY.value, inputRange, [baseScale, 1], 'clamp');
    return { transform: [{ scale }] };
  };

  const getOpacityStyle = (inputRange: number[]) => {
    'worklet';
    const opacity = interpolate(scrollY.value, inputRange, [0, 1], 'clamp');
    return { opacity };
  };

  return {
    scrollHandler,
    scrollY,
    getScaleStyle,
    getOpacityStyle,
  };
}

/**
 * Hook for header that shrinks on scroll
 */
export function useCollapsingHeader(maxHeight = 200, minHeight = 60) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = () => {
    'worklet';
    const height = interpolate(
      scrollY.value,
      [0, maxHeight - minHeight],
      [maxHeight, minHeight],
      'clamp',
    );
    const opacity = interpolate(scrollY.value, [0, maxHeight - minHeight], [1, 0.8], 'clamp');
    return { height, opacity };
  };

  const titleStyle = () => {
    'worklet';
    const opacity = interpolate(scrollY.value, [0, maxHeight - minHeight], [1, 0], 'clamp');
    const scale = interpolate(scrollY.value, [0, maxHeight - minHeight], [1, 0.8], 'clamp');
    return { opacity, transform: [{ scale }] };
  };

  return {
    scrollHandler,
    scrollY,
    headerStyle,
    titleStyle,
    maxHeight,
    minHeight,
  };
}

/**
 * Hook for card that lifts on scroll (depth effect)
 */
export function useCardLift(threshold = 100) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getCardStyle = (cardIndex: number) => {
    'worklet';
    const baseOffset = cardIndex * threshold;
    const diff = scrollY.value - baseOffset;

    const translateY = interpolate(diff, [-threshold, 0, threshold], [10, 0, -10], 'clamp');

    const scale = interpolate(Math.abs(diff), [0, threshold], [1, 0.95], 'clamp');

    return {
      transform: [{ translateY }, { scale }],
      shadowOpacity: interpolate(Math.abs(diff), [0, threshold], [0.1, 0.05], 'clamp'),
    };
  };

  return {
    scrollHandler,
    scrollY,
    getCardStyle,
  };
}
