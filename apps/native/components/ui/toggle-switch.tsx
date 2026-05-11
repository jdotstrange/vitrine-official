import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '@/lib/colors';

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  size = 'default',
}: ToggleSwitchProps) {
  const translateX = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const width = size === 'sm' ? 44 : 52;
  const height = size === 'sm' ? 24 : 28;
  const thumbSize = size === 'sm' ? 18 : 22;
  const thumbTranslate = width - thumbSize - 4;

  const thumbStyle = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [0, 1],
          outputRange: [2, thumbTranslate],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: value ? colors.primary : colors.muted,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
          },
          thumbStyle,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
