import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';
import { Check, X, AlertCircle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={20} color={colors.foreground} />;
      case 'error':
        return <X size={20} color={colors.foreground} />;
      case 'warning':
        return <AlertCircle size={20} color={colors.foreground} />;
      case 'info':
        return <Info size={20} color={colors.foreground} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.destructive;
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'info':
        return colors.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 16,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        <View style={styles.content}>
          {getIcon()}
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton} accessibilityRole="button" accessibilityLabel="Dismiss notification">
            <X size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 200,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  dismissButton: {
    padding: 4,
  },
});
