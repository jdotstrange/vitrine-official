/**
 * KeyboardSafeScroll — scrollable container that keeps the focused input
 * above the keyboard. Wraps react-native-keyboard-controller's
 * KeyboardAwareScrollView with V3-friendly defaults.
 *
 * Use for forms with 2+ fields (settings, profile edit, multi-field upload,
 * showcase review). For single-field modals or sheets with their own
 * scroll/list, prefer KeyboardSafeSheet. For composer bars, see
 * KeyboardSafeComposer.
 *
 * Defaults (HIG-aligned):
 *   bottomOffset                  56pt    Caret breathing room above the
 *                                          keyboard (sized for a 44pt
 *                                          accessory bar + 12pt slack).
 *   keyboardShouldPersistTaps     'handled' Taps on Touchables still register
 *                                          while the keyboard is open.
 *   keyboardDismissMode           'interactive' Flick-down drags the keyboard
 *                                          with the gesture on iOS.
 *   showsVerticalScrollIndicator  false   Brand-quiet default; pass `true`
 *                                          on surfaces that need it.
 *
 */

import React from 'react';
import {
  type StyleProp,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export interface KeyboardSafeScrollProps extends Omit<ScrollViewProps, 'children'> {
  /**
   * Distance kept between the caret in the focused input and the top of
   * the keyboard (or the system accessory bar, if visible). Default 56pt.
   */
  bottomOffset?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function KeyboardSafeScroll({
  bottomOffset = 56,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'interactive',
  showsVerticalScrollIndicator = false,
  children,
  ...rest
}: KeyboardSafeScrollProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
