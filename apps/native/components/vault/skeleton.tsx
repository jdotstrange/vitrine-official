import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, RADII } from '@/lib/design';

/**
 * Skeleton — V3 loading pulse primitives.
 *
 *   SkeletonRect    — boxes (cards, rows, bars)
 *   SkeletonCircle  — avatars, dots, round medallions
 *   SkeletonGroup   — wraps a screen skeleton with shared pulse + a11y
 *   SkeletonPulseProvider — optional; one opacity driver for a subtree
 *
 * Animation is a subtle opacity pulse on the native driver — no gradient
 * shimmer, no global provider required at the app root.
 */

const SkeletonPulseContext = createContext<Animated.Value | null>(null);

function usePulseOpacity(): Animated.Value {
  const shared = useContext(SkeletonPulseContext);
  const local = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (shared) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(local, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(local, {
          toValue: 0.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shared, local]);

  return shared ?? local;
}

export function SkeletonPulseProvider({ children }: { children: React.ReactNode }) {
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
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <SkeletonPulseContext.Provider value={opacity}>{children}</SkeletonPulseContext.Provider>
  );
}

interface SkeletonBaseProps {
  style?: ViewStyle;
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
  const opacity = usePulseOpacity();

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
  const opacity = usePulseOpacity();

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

/** Screen-level skeleton wrapper — shared pulse + loading a11y. */
export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
  return (
    <SkeletonPulseProvider>
      <View style={style} accessibilityRole="progressbar" accessibilityLabel="Loading">
        {children}
      </View>
    </SkeletonPulseProvider>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
