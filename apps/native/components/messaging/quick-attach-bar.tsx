import React, { createContext, useContext, useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  ChevronRight,
  ImageIcon,
} from 'lucide-react-native';
import { useMessageComposer, useStateStore } from 'stream-chat-expo';
import type { TextComposerState } from 'stream-chat';

import { useTheme } from '@/lib/design';
import { CollectibleIcon, ShowcaseIcon } from '@/components/vault';

/**
 * QuickAttachBar — inline collapsing row of attach actions, mounted as
 * Stream's `InputButtons` slot inside `<Channel>`.
 *
 * Pattern: Facebook Messenger's input-aware action row.
 *   - Idle (no focus, no text): four glyphs visible — Camera, Library,
 *     Share Collectible, Share Showcase. One tap each, no drilldowns.
 *   - Active (input focused or has text): the row collapses to a single
 *     `>` chevron, freeing horizontal real estate so the text composer
 *     can grow to fill the row.
 *   - Tap the chevron: glyphs re-expand WITHOUT dismissing the keyboard,
 *     mirroring Messenger. The next keystroke re-collapses, keeping the
 *     active typing surface wide once the user is actually composing.
 *
 * Trigger sources:
 *   - Keyboard show/hide events — proxy for input focus, since Stream's
 *     internal `TextInput` doesn't expose focus state we can read.
 *   - Composer text length, read via `useMessageComposer().textComposer`
 *     state store — covers the "manually expanded but kept typing" path.
 *   - Manual chevron tap → expand override.
 *
 * Why context for actions: Stream's `InputButtons` slot is rendered as
 * `<InputButtons />` with no caller-supplied props. The owning page
 * declares the action handlers via `<QuickAttachProvider actions={...}>`
 * around `<Channel>`, and the bar reads them via context.
 *
 * Visual contract:
 *   - 36×36 icon wraps to align with the 36×36 `SendButton` on the same
 *     row (Stream's `composerContainer` is `alignItems: 'center'` per
 *     the thread theme, so vertical centering is automatic).
 *   - `textSecondary` glyphs at rest, `brandVolt` + `pressOverlay` on
 *     press, selection-tier haptic on every tap.
 *   - No chrome around the bar itself (the input row's own border owns
 *     the chrome). Inter-icon dividers were tried and dropped — at 36pt
 *     icon wraps the row reads cleanly without them and the dividers
 *     just added visual noise to a band that needs to feel light.
 */

const EASING = Easing.bezier(0.32, 0.72, 0, 1);
const LAYOUT_DURATION = 240;
const FADE_IN_DURATION = 180;
const FADE_OUT_DURATION = 120;

export interface QuickAttachActions {
  onTakePhoto: () => void;
  onPickFromLibrary: () => void;
  onShareCollectible: () => void;
  onShareShowcase: () => void;
}

const QuickAttachContext = createContext<QuickAttachActions | null>(null);

export function QuickAttachProvider({
  actions,
  children,
}: {
  actions: QuickAttachActions;
  children: React.ReactNode;
}) {
  return (
    <QuickAttachContext.Provider value={actions}>
      {children}
    </QuickAttachContext.Provider>
  );
}

interface AttachAction {
  key: string;
  // Permissive icon contract — accepts both lucide-react-native glyphs
  // and our branded `@/components/vault` icons. Both expose the same
  // `{ size, color, strokeWidth }` surface, so the row primitive
  // doesn't care which family rendered it.
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  onPress: () => void;
}

const textComposerSelector = (state: TextComposerState) => ({
  hasText: !!state.text,
});

export function QuickAttachBar() {
  const actionsCtx = useContext(QuickAttachContext);
  const { textComposer } = useMessageComposer();
  const { hasText } = useStateStore(textComposer.state, textComposerSelector);

  const [expanded, setExpanded] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setExpanded(false);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setExpanded(true);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Manually expanded → first keystroke re-collapses. Engaging the
  // composer always wins over the manual expand override; this matches
  // Messenger and keeps the typing surface from feeling cramped after
  // the user has clearly committed to writing.
  useEffect(() => {
    if (hasText && keyboardVisible && expanded) {
      setExpanded(false);
    }
  }, [hasText, keyboardVisible, expanded]);

  if (!actionsCtx) return null;

  const handleExpand = () => {
    Haptics.selectionAsync();
    setExpanded(true);
  };

  return (
    <Animated.View
      style={styles.container}
      layout={LinearTransition.duration(LAYOUT_DURATION).easing(EASING)}
    >
      {expanded ? (
        <ExpandedRow actions={actionsCtx} key="expanded" />
      ) : (
        <CollapsedChevron onExpand={handleExpand} key="collapsed" />
      )}
    </Animated.View>
  );
}

function ExpandedRow({ actions }: { actions: QuickAttachActions }) {
  const { colors } = useTheme();
  const items: ReadonlyArray<AttachAction> = [
    { key: 'camera', icon: Camera, label: 'Take photo', onPress: actions.onTakePhoto },
    { key: 'library', icon: ImageIcon, label: 'Photo library', onPress: actions.onPickFromLibrary },
    { key: 'collectible', icon: CollectibleIcon, label: 'Share collectible', onPress: actions.onShareCollectible },
    { key: 'showcase', icon: ShowcaseIcon, label: 'Share showcase', onPress: actions.onShareShowcase },
  ];

  const handlePress = (action: AttachAction) => {
    Haptics.selectionAsync();
    action.onPress();
  };

  return (
    <Animated.View
      style={styles.row}
      entering={FadeIn.duration(FADE_IN_DURATION).easing(EASING)}
      exiting={FadeOut.duration(FADE_OUT_DURATION).easing(EASING)}
    >
      {items.map((action) => {
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            onPress={() => handlePress(action)}
            style={({ pressed }) => [
              styles.iconWrap,
              pressed && { backgroundColor: colors.pressOverlay },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={6}
          >
            {({ pressed }) => (
              <Icon
                size={22}
                color={pressed ? colors.brandVolt : colors.textSecondary}
                strokeWidth={1.85}
              />
            )}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

function CollapsedChevron({ onExpand }: { onExpand: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(FADE_IN_DURATION).easing(EASING)}
      exiting={FadeOut.duration(FADE_OUT_DURATION).easing(EASING)}
    >
      <Pressable
        onPress={onExpand}
        style={({ pressed }) => [
          styles.iconWrap,
          pressed && { backgroundColor: colors.pressOverlay },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Show attach actions"
        accessibilityHint="Expands camera, photo library, share collectible, and share showcase buttons"
        hitSlop={6}
      >
        {({ pressed }) => (
          <ChevronRight
            size={22}
            color={pressed ? colors.brandVolt : colors.textSecondary}
            strokeWidth={2}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapPressed: {
  },
});
