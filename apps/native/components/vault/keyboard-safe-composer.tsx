/**
 * KeyboardSafeComposer — sticky input bar that floats above the keyboard
 * with the system frame-by-frame animation. Wraps
 * react-native-keyboard-controller's KeyboardStickyView.
 *
 * Use for standalone composer bars or action docks that should glide
 * with the keyboard without affecting the layout of content above them
 * (where the content scroll above is managed separately, e.g. a FlatList
 * with `automaticallyAdjustKeyboardInsets`).
 *
 * For chat threads where the entire message list needs to reflow above
 * the keyboard, prefer KeyboardSafeSheet (KAV semantics) — it keeps the
 * sticky-footer + list pattern coherent.
 */

import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

export interface KeyboardSafeComposerProps {
  /**
   * Additional translateY for the bar when the keyboard is closed
   * (`offset.closed`) or open (`offset.opened`). Defaults to no extra
   * offset, meaning the bar sits flush with the safe-area inset when
   * closed and flush against the keyboard top when open.
   */
  offset?: { closed?: number; opened?: number };
  /** Disable sticky behavior — falls back to a static View at the bottom. */
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function KeyboardSafeComposer({
  offset,
  enabled,
  style,
  children,
}: KeyboardSafeComposerProps) {
  return (
    <KeyboardStickyView offset={offset} enabled={enabled} style={style}>
      {children}
    </KeyboardStickyView>
  );
}
