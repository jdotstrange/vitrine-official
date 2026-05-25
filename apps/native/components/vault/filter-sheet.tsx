import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { Button } from './button';
import { KeyboardSafeSheet } from './keyboard-safe-sheet';

/**
 * FilterSheet — iOS-HIG bottom sheet shell for filter / sort / settings
 * affordances.
 *
 * Structure (top → bottom):
 *   - Scrim (tap-to-dismiss, 70% black)
 *   - Sheet body: void surface, top-rounded, frost border on top edge
 *     - Drag handle (4pt × 36pt pill, tertiary ink)
 *     - Header: title (left) · Reset action (right, optional)
 *     - Scrollable content slot (`children`)
 *     - Sticky footer: Apply button (solid, full-width)
 *
 * Pan-down on the handle (or anywhere in the header zone) dismisses.
 * The content slot is intentionally un-opinionated — consumers compose
 * filter groups (sort sections, chip rows, toggles) themselves. When the
 * second filter surface lands, shared group primitives (SheetSection,
 * SheetToggleRow) will graduate out of this file.
 *
 * Why not @gorhom/bottom-sheet: we don't need velocity-aware snap points
 * or imperative programmatic handles yet. React Native's `Modal` with a
 * native-driver slide animation is lighter, dependency-free, and perfectly
 * HIG-compliant for the "one snap point" case.
 */

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  title: string;
  applyLabel?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FilterSheet({
  visible,
  onClose,
  onApply,
  onReset,
  title,
  applyLabel = 'Apply',
  children,
  style,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 0.9,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.8) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  const handleApply = () => {
    onApply?.();
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.scrim, { backgroundColor: colors.scrim }]}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + SPACING.zoneIntra,
              transform: [{ translateY }],
              backgroundColor: colors.void,
              borderColor: colors.frostBorder,
            },
            style,
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleZone}>
            <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
          </View>

          <View
            style={[styles.header, { borderBottomColor: colors.frostDivider }]}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {onReset ? (
              <Pressable
                onPress={onReset}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Reset filters"
              >
                <Text style={[styles.resetLabel, { color: colors.textSecondary }]}>
                  Reset
                </Text>
              </Pressable>
            ) : null}
          </View>

          <KeyboardSafeSheet style={styles.keyboardSafe}>
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {children}
            </ScrollView>

            {onApply ? (
              <View
                style={[styles.footer, { borderTopColor: colors.frostDivider }]}
              >
                <Button
                  label={applyLabel}
                  onPress={handleApply}
                  variant="solid"
                  fullWidth
                />
              </View>
            ) : null}
          </KeyboardSafeSheet>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: RADII.card + 4,
    borderTopRightRadius: RADII.card + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: SPACING.zoneIntra,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  resetLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 13,
  },
  keyboardSafe: {
    flexShrink: 1,
  },
  content: {
    flexGrow: 0,
  },
  contentInner: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    paddingBottom: SPACING.zoneCluster,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
