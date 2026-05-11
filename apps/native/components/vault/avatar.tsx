import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useTheme, TYPE } from '@/lib/design';

/**
 * Avatar — V3 user chrome.
 *
 * Renders a circular avatar from a URL, falling back to an initials tile
 * when no image is available. The initials tile is a void-black surface
 * with a hairline frost border and a monospace uppercase glyph —
 * deliberately quiet, so missing avatars read as "minimal" rather than
 * "broken".
 *
 * Sizes map to semantic roles, not pixel values:
 *   xs (24)  — inline glyphs (row-item bylines)
 *   sm (32)  — compact rows, message threads
 *   md (48)  — identity strips, card meta
 *   lg (72)  — profile header hero
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  ringed?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 72,
};

const INITIAL_FONT_SIZE: Record<AvatarSize, number> = {
  xs: 9,
  sm: 11,
  md: 15,
  lg: 22,
};

export function Avatar({
  uri,
  name,
  size = 'md',
  ringed = false,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const pixelSize = SIZE_MAP[size];
  const initials = useMemo(() => extractInitials(name), [name]);

  const containerStyle: ViewStyle = {
    width: pixelSize,
    height: pixelSize,
    borderRadius: pixelSize / 2,
  };

  const ringStyle: ViewStyle | undefined = ringed
    ? {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.frostBorderStrong,
      }
    : undefined;

  if (uri) {
    return (
      <View
        style={[styles.base, { backgroundColor: colors.sheetBg }, containerStyle, ringStyle, style]}
        accessibilityRole="image"
        accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
      >
        <Image
          source={{ uri }}
          style={[styles.image, containerStyle]}
          contentFit="cover"
          transition={120}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.base, { backgroundColor: colors.sheetBg }, styles.fallback, { borderColor: colors.frostBorder }, containerStyle, ringStyle, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} avatar placeholder` : 'Avatar placeholder'}
    >
      <Text
        style={[
          styles.initials,
          { color: colors.textSecondary, fontSize: INITIAL_FONT_SIZE[size] },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

function extractInitials(name?: string | null): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (!trimmed) return '·';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]![0] ?? '';
  return (first + last).toUpperCase();
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  initials: {
    fontFamily: TYPE.monoMedium,
    letterSpacing: 0.5,
  },
});
