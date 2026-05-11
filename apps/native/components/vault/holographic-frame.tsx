import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, RADII } from '@/lib/design';

export interface HolographicFrameProps {
  children: React.ReactNode;
  active?: boolean;
  borderRadius?: number;
  intensity?: 'subtle' | 'standard';
  style?: ViewStyle;
}

/**
 * HolographicFrame adds premium chrome around a card without changing the
 * card's information layout. Use sparingly for featured or elevated objects.
 */
export function HolographicFrame({
  children,
  active = true,
  borderRadius = RADII.card,
  intensity = 'standard',
  style,
}: HolographicFrameProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(1);
  const progress = useSharedValue(-1);
  const opacity = intensity === 'subtle' ? 0.18 : 0.28;

  useEffect(() => {
    if (!active) {
      progress.value = -1;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, {
        duration: 7200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      false,
    );
  }, [active, progress]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * (width + 180) - 150 },
      { rotateZ: '-18deg' },
    ],
  }));

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius,
          shadowOpacity: intensity === 'subtle' ? 0.14 : 0.22,
          backgroundColor: colors.void,
        },
        style,
      ]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <LinearGradient
        colors={[
          'rgba(214, 235, 253, 0.10)',
          'rgba(34, 211, 238, 0.34)',
          'rgba(240, 240, 240, 0.42)',
          'rgba(187, 202, 58, 0.30)',
          'rgba(167, 139, 250, 0.24)',
          'rgba(214, 235, 253, 0.12)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.inner,
          { borderRadius: Math.max(0, borderRadius - 1), backgroundColor: colors.void },
        ]}
      >
        {children}
      </View>

      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.sheen, { opacity }, sheenStyle]}
        >
          <LinearGradient
            colors={[
              'transparent',
              'rgba(34, 211, 238, 0.10)',
              'rgba(240, 240, 240, 0.50)',
              'rgba(187, 202, 58, 0.13)',
              'transparent',
            ]}
            locations={[0, 0.35, 0.5, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      <View pointerEvents="none" style={[styles.frostLine, { borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 1,
    overflow: 'hidden',
    shadowColor: '#88d9ff',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  inner: {
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    width: 92,
  },
  frostLine: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(240, 240, 240, 0.20)',
  },
});
