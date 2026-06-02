import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

/**
 * ActionDock — floating bottom primary CTA for flow steps.
 *
 * A full-width pill pinned above the home indicator — no sheet, blur slab,
 * or top hairline. The filled enabled state carries its own elevation so
 * the action reads as a distinct object over the scroll canvas.
 *
 * CTA states (HIG primary-button pattern):
 *   - Enabled: filled pill (`brandVolt` + `textInverse`) with drop shadow
 *   - Disabled: solid muted pill (`sheetBg`, secondary label) — not opacity-only
 *   - Touch target: 44pt minimum height
 *
 * Reserve bottom scroll padding with `ActionDock.reservedHeight(insets.bottom)`
 * so the last item clears the floating pill.
 *
 * Usage:
 *   <ActionDock
 *     label="Looks Good"
 *     icon={ArrowRight}
 *     bottomInset={insets.bottom}
 *     onPress={handleConfirm}
 *   />
 */

export interface ActionDockProps {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  iconPosition?: 'leading' | 'trailing';
  bottomInset: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  haptic?: boolean;
  style?: ViewStyle;
}

/** HIG minimum touch target for primary actions. */
const BUTTON_HEIGHT = 44;
/** Breathing room between scroll content and the floating pill. */
const FLOAT_CLEARANCE = SPACING.zoneIntra;

function bottomPadFor(bottomInset: number): number {
  return Math.max(bottomInset, 14);
}

export function ActionDock({
  label,
  onPress,
  icon: Icon,
  iconPosition = 'trailing',
  bottomInset,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  haptic = true,
  style,
}: ActionDockProps) {
  const { colors } = useTheme();
  const bottomPad = bottomPadFor(bottomInset);
  const enabled = !disabled;
  const labelColor = enabled ? colors.textInverse : colors.textSecondary;
  const iconColor = enabled ? colors.textInverse : colors.textSecondary;

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Haptics.selectionAsync();
    onPress();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          paddingBottom: bottomPad,
          paddingTop: FLOAT_CLEARANCE,
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          enabled
            ? [styles.buttonEnabled, { backgroundColor: colors.brandVolt, shadowColor: colors.void }]
            : { backgroundColor: colors.sheetBg },
          pressed && enabled && styles.buttonPressed,
        ]}
      >
        {Icon && iconPosition === 'leading' && (
          <Icon size={14} color={iconColor} strokeWidth={2} />
        )}
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {Icon && iconPosition === 'trailing' && (
          <Icon size={14} color={iconColor} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}

/**
 * Reserved vertical space the floating pill occupies.
 * Use for bottom content padding so the last scroll item clears the CTA.
 */
ActionDock.reservedHeight = (bottomInset: number): number =>
  FLOAT_CLEARANCE + BUTTON_HEIGHT + bottomPadFor(bottomInset);

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.gutter,
    zIndex: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: BUTTON_HEIGHT,
    height: BUTTON_HEIGHT,
    borderRadius: RADII.pill,
    width: '100%',
  },
  buttonEnabled: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  label: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
});
