import React from 'react';
import { Switch, Platform, StyleSheet, View, type AccessibilityRole } from 'react-native';
import { useTheme } from '@/lib/design';

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Visual scale — `sm` shrinks ~10% on iOS via transform. Defaults to `default`. */
  size?: 'default' | 'sm';
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * ToggleSwitch — thin wrapper over React Native's `<Switch>`, which maps to
 * UIKit `UISwitch` on iOS and Material Switch on Android.
 *
 * Previously a custom Animated.View toggle that hardcoded legacy palette
 * colors and inverted iOS conventions (off = full light, on = near-black).
 * Replaced with the platform-native control so we inherit:
 *   - Selection haptic on flip (iOS)
 *   - VoiceOver "on/off" value announcements
 *   - Platform-correct animation curves
 *   - Reduced-Motion + Dynamic Type compliance
 *
 * Theming follows iOS HIG: ON track is `semanticGreen` (the iOS convention
 * for "enabled"), OFF track is `frostBorderStrong` (a muted, visible neutral
 * that reads as "track present, inactive"). Thumb stays white per HIG.
 */
export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  size = 'default',
  accessibilityLabel,
  accessibilityRole = 'switch',
}: ToggleSwitchProps) {
  const { colors } = useTheme();

  const trackOff = colors.frostBorderStrong;
  const trackOn = colors.semanticGreen;
  const thumb = '#FFFFFF';

  const scale = size === 'sm' ? 0.85 : 1;
  const wrapperStyle =
    Platform.OS === 'ios' && size === 'sm'
      ? { transform: [{ scale }] }
      : undefined;

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: trackOff, true: trackOn }}
        thumbColor={thumb}
        ios_backgroundColor={trackOff}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
