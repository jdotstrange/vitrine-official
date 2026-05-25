/**
 * KeyboardSafeSheet — modal / sheet / chat-thread container that lifts
 * its contents above the keyboard. Wraps
 * react-native-keyboard-controller's KeyboardAvoidingView with the right
 * iOS / Android behaviors.
 *
 * Use for:
 *   - Modals or bottom sheets that own a scroll view, list, or sticky
 *     footer of their own (multi-field upload review, edit-pricing modal,
 *     edit-info modal, rapid-fire edit).
 *   - Chat threads (FlatList of messages + sticky composer) where the
 *     whole stack should pad above the keyboard so messages reflow.
 *
 * For plain multi-field forms without an inner scroll, prefer
 * KeyboardSafeScroll — it auto-scrolls the focused input into view.
 *
 * Defaults:
 *   iOS:     behavior="padding"  Container pads its bottom to clear the
 *                                  keyboard.
 *   Android: behavior="height"   Container height shrinks. Pairs with the
 *                                  global setInputMode(adjustResize) call
 *                                  in app/_layout.tsx so the OS handles
 *                                  the resize natively.
 */

import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export interface KeyboardSafeSheetProps {
  /**
   * Extra vertical offset added to the keyboard avoidance calculation.
   * Pass the height of any custom top-bar / nav-bar sitting above the
   * sheet so the keyboard's reported top is corrected accordingly.
   * Default 0.
   */
  offset?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  children?: React.ReactNode;
}

export function KeyboardSafeSheet({
  offset = 0,
  style,
  pointerEvents,
  children,
}: KeyboardSafeSheetProps) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
      pointerEvents={pointerEvents}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
