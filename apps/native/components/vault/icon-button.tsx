import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme, RADII } from '@/lib/design';

/**
 * IconButton — tappable square with a single Lucide icon.
 *
 * The V3 replacement for the legacy `ActionIcon`. Used anywhere an icon
 * alone is the affordance — top bars, toolbars, compact rows.
 *
 * Design contract:
 *   - 44pt hit target (iOS HIG minimum) regardless of visual size.
 *   - No chrome by default. Pressed state is a subtle white-ink wash.
 *   - Selection haptic on press.
 *   - Required `label` for accessibility; nothing ships without it.
 */

type IconButtonVariant =
  // No chrome, neutral ink. Default.
  | 'ghost'
  // Frost-outlined bezel — for contexts where the button needs visual weight
  // on its own (e.g. overlaid on imagery).
  | 'frost';

export interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  label: string;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon: Icon,
  onPress,
  label,
  variant = 'ghost',
  size = 20,
  disabled = false,
  haptic = true,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Haptics.selectionAsync();
    onPress?.();
  };

  const iconColor = disabled ? colors.textTertiary : colors.textPrimary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === 'frost' && [
          styles.frost,
          { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        ],
        pressed && !disabled && { backgroundColor: colors.pressOverlay },
        style,
      ]}
    >
      <View style={styles.inner}>
        <Icon size={size} color={iconColor} strokeWidth={1.75} />
      </View>
    </Pressable>
  );
}

const HIT_TARGET = 44;

const styles = StyleSheet.create({
  base: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
  },
  frost: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
