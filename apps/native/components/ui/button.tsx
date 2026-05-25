import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/design';

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Legacy `Button` primitive — kept for backwards compatibility with V3-adjacent
 * surfaces (`settings-support`, `settings-bug-report`) that still use the rich
 * variant API. For new V3 work, prefer `Button` from `@/components/vault` which
 * has a tighter API (`label`-only) and ships with haptics, hit-slop, and a
 * smaller variant set.
 *
 * Internally themed via `useTheme()` so the resolved colors track Light/Dark/
 * Auto. No legacy palette imports remain.
 */
export function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  children,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantBg: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
    default: { backgroundColor: colors.textPrimary },
    destructive: { backgroundColor: colors.semanticRed },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.frostBorder },
    secondary: { backgroundColor: colors.sheetBg },
    ghost: { backgroundColor: 'transparent' },
    link: { backgroundColor: 'transparent' },
  };

  const variantTextColor: Record<NonNullable<ButtonProps['variant']>, string> = {
    default: colors.textInverse,
    destructive: colors.textInverse,
    outline: colors.textPrimary,
    secondary: colors.textPrimary,
    ghost: colors.textPrimary,
    link: colors.brandVolt,
  };

  const buttonStyle: Array<ViewStyle | false | undefined> = [
    styles.base,
    variantBg[variant],
    styles[`size_${size}`],
    isDisabled && styles.disabled,
    style,
  ];

  const buttonTextStyle: Array<TextStyle | false | undefined> = [
    styles.text,
    { color: variantTextColor[variant] },
    variant === 'link' && styles.text_link,
    styles[`textSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantTextColor[variant]}
        />
      ) : typeof children === 'string' ? (
        <Text style={buttonTextStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  size_default: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  size_sm: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  size_lg: {
    height: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  size_icon: {
    width: 36,
    height: 36,
    padding: 0,
  },
  'size_icon-sm': {
    width: 32,
    height: 32,
    padding: 0,
  },
  'size_icon-lg': {
    width: 40,
    height: 40,
    padding: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  text_link: {
    textDecorationLine: 'underline',
  },
  textSize_default: {
    fontSize: 14,
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_lg: {
    fontSize: 16,
  },
  textSize_icon: {
    fontSize: 14,
  },
  'textSize_icon-sm': {
    fontSize: 12,
  },
  'textSize_icon-lg': {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
