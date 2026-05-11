import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, RADII } from '@/lib/design';

/**
 * Skeleton — loading shimmer primitive.
 *
 * Two shapes cover the needs we've surfaced:
 *   SkeletonRect   — boxes (cards, rows, bars)
 *   SkeletonCircle — avatars, dots, round medallions
 *
 * Animation is a subtle opacity pulse driven by `Animated` with the native
 * driver — no shimmering gradient, no JS-driven loop. Keeps the loading
 * state feeling like the rest of the V3 DNA: quiet, technical, restrained.
 */

interface SkeletonBaseProps {
  style?: ViewStyle;
}

function useShimmerOpacity(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export interface SkeletonRectProps extends SkeletonBaseProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
}

export function SkeletonRect({
  width = '100%',
  height = 16,
  radius = RADII.small,
  style,
}: SkeletonRectProps) {
  const { colors } = useTheme();
  const opacity = useShimmerOpacity();

  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: colors.sheetBg,
          borderColor: colors.frostDivider,
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export interface SkeletonCircleProps extends SkeletonBaseProps {
  size?: number;
}

export function SkeletonCircle({ size = 40, style }: SkeletonCircleProps) {
  const { colors } = useTheme();
  const opacity = useShimmerOpacity();

  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: colors.sheetBg,
          borderColor: colors.frostDivider,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
        style,
      ]}
    />
  );
}

export interface SkeletonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
  return (
    <View style={style} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
