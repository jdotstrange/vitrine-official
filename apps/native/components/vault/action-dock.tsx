import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme, SPACING, TYPE } from '@/lib/design';

/**
 * ActionDock — sticky bottom confirmation/submit surface.
 *
 * The "modern add-to-cart" pattern: a fused, blurred bar pinned to the
 * screen bottom that holds the primary commit action for a flow step.
 * It replaces the old "plain button at the end of a ScrollView" pattern
 * with a single, always-visible CTA that reads as its own zone.
 *
 * Structure (mirrors BottomDock's DNA):
 *   - Absolute-positioned at bottom of its positioning parent so the
 *     surface stays flush against the physical screen edge regardless of
 *     how nested flex layouts behave.
 *   - Dark translucent `sheetBg` base with a `frostBorder` top hairline,
 *     a subtle volt shadow glow above, and a dark `BlurView` backdrop —
 *     so the dock reads as a lifted surface above the scroll canvas.
 *   - Safe-area aware: top and bottom padding both match
 *     `max(bottomInset, 14)` so the label is vertically centered in the
 *     slab on every device (home-indicator or not), while the dock
 *     extends cleanly into the safe area without exposing the canvas
 *     color beneath.
 *
 * Use this anywhere a flow step has a single committing CTA: upload
 * review, listing creation, checkout, wizard confirmations, etc. Also
 * reserve a matching bottom offset on the scroll content above
 * (`ActionDock.reservedHeight(insets.bottom)`) so the last item doesn't
 * sit hidden behind the dock.
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
  haptic?: boolean;
  style?: ViewStyle;
}

const BUTTON_HEIGHT = 32;

function verticalPadFor(bottomInset: number): number {
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
  haptic = true,
  style,
}: ActionDockProps) {
  const { colors } = useTheme();
  const verticalPad = verticalPadFor(bottomInset);

  const handlePress = () => {
    if (disabled) return;
    if (haptic) Haptics.selectionAsync();
    onPress();
  };

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: verticalPad,
          paddingBottom: verticalPad,
          backgroundColor: colors.sheetBg,
          borderTopColor: colors.frostBorder,
          shadowColor: colors.brandVolt,
        },
        style,
      ]}
    >
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.glass, { backgroundColor: colors.sheetBg }]} />
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        {Icon && iconPosition === 'leading' && (
          <Icon size={14} color={colors.brandVolt} strokeWidth={2} />
        )}
        <Text style={[styles.label, { color: colors.brandVolt }]}>{label}</Text>
        {Icon && iconPosition === 'trailing' && (
          <Icon size={14} color={colors.brandVolt} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}

/**
 * Reserved vertical space the dock occupies above the safe-area.
 * Use for bottom content padding so the last scroll item clears the dock.
 */
ActionDock.reservedHeight = (bottomInset: number): number =>
  verticalPadFor(bottomInset) * 2 + BUTTON_HEIGHT;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
    paddingHorizontal: SPACING.gutter,
    overflow: 'hidden',
    zIndex: 50,
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: BUTTON_HEIGHT,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
});
