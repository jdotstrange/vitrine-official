import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MoreHorizontal, type LucideIcon } from 'lucide-react-native';

import {
  useTheme,
  RADII,
  SPACING,
  STATUS_CONFIG,
  TYPE,
  type ListingStatus,
} from '@/lib/design';

/**
 * DetailActionDock — bottom dock for the collectible detail surface.
 *
 * Two-zone composition:
 *
 *   [ kicker         ]   [ icon · icon · icon · ⋯ ]
 *   [ value          ]
 *
 * Left = display anchor (non-interactive). Right = quick action rail
 * with the `⋯` overflow as its always-present rightmost slot.
 *
 * The rail follows the [`QuickAttachBar`](../messaging/quick-attach-bar.tsx)
 * vocabulary — 36×36 ghost glyph wraps, no border chrome, `textSecondary`
 * at rest, `brandVolt` on press, selection-tier haptic on every tap. Any
 * action can opt into an `active` state (filled glyph + `textPrimary`)
 * for toggle-style affordances like Track / Save / Pin.
 *
 * Status-tinted chrome — "the dock IS the status pill, just stretched":
 *   Glass wash, top hairline, kicker color, and shadow glow all flow
 *   from `STATUS_CONFIG[status]` — the same source of truth that drives
 *   `StatusPill` and `StatusDot`. The dock therefore reads as a
 *   wide-format status surface: 18–20% hue fill for the band, mid-alpha
 *   border for the hairline, and the **fully-saturated hue on the
 *   kicker text** so a quick glance lands on a colored "TRACKED BY 8"
 *   or "VALUE" line that visually echoes the pill near the title.
 *
 *   Hierarchy by job:
 *     - status hue   → kicker text + glass wash (state)
 *     - textPrimary  → value text (content / dollar anchor)
 *     - textSecondary → action glyphs (affordance)
 *
 *   NFST falls out of the same lookup — `STATUS_CONFIG.NFST` is already
 *   calibrated as the system's neutral state (12% silver fill,
 *   frostBorderStrong hairline, textPrimary kicker). One exception:
 *   NFST's `chrome.text` is `textPrimary` white, which would project a
 *   white shadow halo from the bar — so NFST shadow stays `brandVolt`
 *   (the brand-identity rest glow), commerce statuses inherit
 *   `chrome.text` for the shadow.
 *
 * Persists across all six lenses (DETAILS · SPECS · PULSE · AAR · VAR ·
 * COMPS). Reserve scroll-content padding with
 * `DetailActionDock.reservedHeight` so the lens scrollers' last items
 * clear the dock.
 */

// ---------------------------------------------------------------------------
// PUBLIC TYPES
// ---------------------------------------------------------------------------

export interface DetailActionDockAction {
  /** Stable identity — drives React keys + a11y. */
  key: string;
  /** Lucide icon class for the glyph. */
  icon: LucideIcon;
  /** Accessibility label (also used as the press a11y hint). */
  label: string;
  /** Tap handler. The dock fires a selection haptic before invoking. */
  onPress: () => void;
  /**
   * Toggle-style "this affordance is currently engaged" state.
   * Renders the glyph filled in `textPrimary` (cf. Instagram bookmark).
   * Used for Track in V1; reserved for future Save / Pin / etc.
   */
  active?: boolean;
}

export interface DetailActionDockProps {
  /** Bottom safe-area inset from `useSafeAreaInsets`. */
  bottomInset: number;
  /** Tap on `⋯` — caller opens the appropriate ActionSheet. */
  onMore: () => void;
  /** Center-left value text — already-formatted (e.g. `$12,400` or `—`). */
  value: string;
  /**
   * Tiny uppercase rail above the value. Drives signal —
   * `VALUE`, `TRACKED BY 8`, `NOT FOR SALE`, etc.
   */
  valueKicker?: string;
  /**
   * Listing status — drives the dock's tinted chrome (hairline, wash,
   * shadow glow). NFST renders the canonical neutral treatment.
   */
  status: ListingStatus;
  /**
   * Inline quick actions, rendered left-of-`⋯` in array order. The dock
   * doesn't enforce a count — three is the V1 contract for collectible
   * detail (visitor: Track · Message · Share, owner: QR · Share · Edit)
   * but the rail accepts any reasonable number.
   */
  actions: ReadonlyArray<DetailActionDockAction>;
  /** Wrapper style override (rare — usually not needed). */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// LAYOUT CONSTANTS
// ---------------------------------------------------------------------------

const RAIL_HEIGHT = 36;
const ICON_WRAP_SIZE = 36;
const ICON_GLYPH_SIZE = 22;

function verticalPadFor(bottomInset: number): number {
  return Math.max(bottomInset, 14);
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function DetailActionDock({
  bottomInset,
  onMore,
  value,
  valueKicker = 'VALUE',
  status,
  actions,
  style,
}: DetailActionDockProps) {
  const { colors } = useTheme();
  const verticalPad = verticalPadFor(bottomInset);
  const chrome = STATUS_CONFIG[status];

  const shadowColor =
    status === 'NFST' ? colors.brandVolt : chrome.text;

  const handleMore = () => {
    Haptics.selectionAsync();
    onMore();
  };

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.sheetBg },
        {
          paddingTop: verticalPad,
          paddingBottom: verticalPad,
          borderTopColor: chrome.border,
          shadowColor,
        },
        style,
      ]}
    >
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.glass, { backgroundColor: colors.sheetBg }]} />
      <View style={[styles.wash, { backgroundColor: chrome.fill }]} />

      <View style={styles.row}>
        <View style={styles.valueStack} accessibilityElementsHidden>
          <Text
            style={[styles.valueKicker, { color: chrome.text }]}
            numberOfLines={1}
          >
            {valueKicker}
          </Text>
          <Text
            style={[styles.valueText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {value || '—'}
          </Text>
        </View>

        <View style={styles.rail}>
          {actions.map((action) => (
            <RailGlyph key={action.key} action={action} />
          ))}

          <Pressable
            onPress={handleMore}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconWrap,
              pressed && { backgroundColor: colors.pressOverlay },
            ]}
          >
            {({ pressed }) => (
              <MoreHorizontal
                size={ICON_GLYPH_SIZE}
                color={pressed ? colors.brandVolt : colors.textSecondary}
                strokeWidth={1.85}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Reserved vertical space the dock occupies above the safe-area.
 * Use as bottom content padding so the last scroll item clears the dock.
 */
DetailActionDock.reservedHeight = (bottomInset: number): number =>
  verticalPadFor(bottomInset) * 2 + RAIL_HEIGHT;

// ---------------------------------------------------------------------------
// RAIL GLYPH — 36×36 ghost wrap. textSecondary at rest, brandVolt on press.
// Active actions render the glyph filled in textPrimary (Track when
// already tracking, Save when saved, etc.) for instant visual confirmation.
// ---------------------------------------------------------------------------

function RailGlyph({ action }: { action: DetailActionDockAction }) {
  const { colors } = useTheme();
  const Icon = action.icon;
  const handlePress = () => {
    Haptics.selectionAsync();
    action.onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ selected: !!action.active }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconWrap,
        pressed && { backgroundColor: colors.pressOverlay },
      ]}
    >
      {({ pressed }) => {
        const color = pressed
          ? colors.brandVolt
          : action.active
            ? colors.textPrimary
            : colors.textSecondary;
        return (
          <Icon
            size={ICON_GLYPH_SIZE}
            color={color}
            strokeWidth={action.active ? 2.1 : 1.85}
            fill={action.active ? color : 'transparent'}
          />
        );
      }}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
    paddingHorizontal: SPACING.gutter,
    overflow: 'hidden',
    zIndex: 50,
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: RAIL_HEIGHT,
  },
  valueStack: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  valueKicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  valueText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  rail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: ICON_WRAP_SIZE,
    height: ICON_WRAP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.medium,
  },
});
