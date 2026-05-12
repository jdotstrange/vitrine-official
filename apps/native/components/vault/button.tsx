import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme, RADII, TYPE } from '@/lib/design';
import { DARK_COLORS } from '@vitrine/design-tokens';

/**
 * Button — the V3 CTA primitive.
 *
 * Three variants cover the range we actually ship:
 *   - solid   — high-emphasis action (Follow, Sign in, Apply).
 *                Ink-white bg, void-black text. The brand's "primary voice".
 *   - frost   — medium-emphasis secondary (Edit Profile, Message, Following
 *                state). Transparent with frost border, white text.
 *   - ghost   — low-emphasis, no chrome (Cancel, Reset, tertiary actions).
 *
 * Sizes come in `md` (default, 40pt) and `sm` (32pt) — large enough to hit
 * HIG's 44pt target with `hitSlop` on the small size. A `fullWidth` prop
 * stretches the button edge-to-edge for sheet footers and empty-state CTAs.
 */

type ButtonVariant = 'solid' | 'frost' | 'ghost';
type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'leading' | 'trailing';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon: Icon,
  iconPosition = 'leading',
  disabled = false,
  loading = false,
  fullWidth = false,
  haptic = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isInteractive = !disabled && !loading;

  const handlePress = () => {
    if (!isInteractive) return;
    if (haptic) Haptics.selectionAsync();
    onPress?.();
  };

  const textColor = getTextColor(variant, disabled);
  const sizeStyle = size === 'sm' ? styles.sizeSm : styles.sizeMd;
  const textSizeStyle = size === 'sm' ? styles.textSm : styles.textMd;

  const variantColorStyle = (() => {
    switch (variant) {
      case 'solid':
        return { backgroundColor: colors.textPrimary };
      case 'frost':
        return { borderColor: colors.frostBorderStrong };
      case 'ghost':
        return undefined;
    }
  })();

  const pressedColorStyle =
    variant === 'frost' || variant === 'ghost'
      ? { backgroundColor: colors.pressOverlay }
      : undefined;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      hitSlop={size === 'sm' ? 8 : 4}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyles[variant],
        variantColorStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && isInteractive && pressedVariantStyles[variant],
        pressed && isInteractive && pressedColorStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'leading' && (
            <Icon size={size === 'sm' ? 13 : 14} color={textColor} strokeWidth={2} />
          )}
          <Text style={[styles.label, textSizeStyle, { color: textColor }]}>
            {label}
          </Text>
          {Icon && iconPosition === 'trailing' && (
            <Icon size={size === 'sm' ? 13 : 14} color={textColor} strokeWidth={2} />
          )}
        </View>
      )}
    </Pressable>
  );
}

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return DARK_COLORS.textTertiary;
  switch (variant) {
    case 'solid':
      return DARK_COLORS.textInverse;
    case 'frost':
    case 'ghost':
      return DARK_COLORS.textPrimary;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
  },
  sizeMd: {
    height: 40,
    paddingHorizontal: 18,
  },
  sizeSm: {
    height: 32,
    paddingHorizontal: 14,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: TYPE.interSemiBold,
    letterSpacing: 0,
  },
  textMd: {
    fontSize: 14,
    lineHeight: 16,
  },
  textSm: {
    fontSize: 12,
    lineHeight: 14,
  },
});

const variantStyles = StyleSheet.create({
  solid: {},
  frost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const pressedVariantStyles = StyleSheet.create({
  solid: {
    opacity: 0.82,
  },
  frost: {},
  ghost: {},
});
