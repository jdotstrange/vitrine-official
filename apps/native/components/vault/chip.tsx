import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, RADII, TYPE } from '@/lib/design';

/**
 * Chip — selectable text tag.
 *
 * Stateful counterpart to the data-bound `StatusPill` / `TraitPill`. Used
 * for filter chips, category toggles, and anywhere a small tappable tag
 * represents a selectable option rather than a fixed label.
 *
 * Selected chips use the brandVolt active treatment established in Collector
 * Profile V3, keeping brand state distinct from semantic trait colors.
 */

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  haptic = true,
  style,
}: ChipProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        selected
          ? [styles.selected, { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder }]
          : [styles.unselected, { borderColor: colors.frostBorder }],
        disabled && styles.disabled,
        pressed && !disabled && !selected && { backgroundColor: colors.pressOverlay },
        pressed && !disabled && selected && styles.pressedSelected,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected
            ? { color: colors.textPrimary }
            : { color: colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unselected: {
    backgroundColor: 'transparent',
  },
  selected: {},
  disabled: {
    opacity: 0.4,
  },
  pressedSelected: {
    opacity: 0.82,
  },
  label: {
    fontFamily: TYPE.interMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
