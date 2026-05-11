import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/colors';

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
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    isDisabled && styles.disabled,
    style,
  ];

  const buttonTextStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
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
          color={variant === 'default' ? colors.primaryForeground : colors.foreground}
        />
      ) : (
        <Text style={buttonTextStyle}>{children}</Text>
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
  default: {
    backgroundColor: colors.primary,
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
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
  text_default: {
    color: colors.primaryForeground,
  },
  text_destructive: {
    color: colors.destructiveForeground,
  },
  text_outline: {
    color: colors.foreground,
  },
  text_secondary: {
    color: colors.secondaryForeground,
  },
  text_ghost: {
    color: colors.foreground,
  },
  text_link: {
    color: colors.primary,
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
