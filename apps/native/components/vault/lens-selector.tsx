import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';

import { useTheme, SPACING, TYPE } from '@/lib/design';

/**
 * LensSelector — horizontal segmented switcher with sticky-header semantics.
 *
 * Extracted from the collectible-detail sandbox's LensSwitcher; the name
 * was generalized because the pattern transcends "analytical lenses on a
 * collectible". Wherever a screen pivots a single entity through related
 * views — detail (Specs/Pulse/AAR/VAR/Comps), profile (Collection/
 * Showcases), future feed (Following/Discover) — this is the control.
 *
 * Design contract:
 *   - Upper-case mono-geometric kicker labels, letter-spacing 1.2.
 *   - Active item: full-contrast ink + 2pt underline.
 *   - Locked item: tertiary ink + lock glyph; still tappable (caller
 *     decides the paywall handoff).
 *   - 44pt touch target per HIG.
 *   - Track centers when content fits, falls back to horizontal scroll
 *     when it overflows.
 *   - Hairline frost borders top and bottom — so when the selector is
 *     pinned as a sticky header, it reads as a data-band edge against
 *     whatever scrolls beneath it.
 */

export interface LensItem<K extends string = string> {
  key: K;
  label: string;
  locked?: boolean;
}

export interface LensSelectorProps<K extends string = string> {
  items: readonly LensItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  variant?: 'compact' | 'display';
  style?: ViewStyle;
}

export function LensSelector<K extends string = string>({
  items,
  activeKey,
  onChange,
  variant = 'compact',
  style,
}: LensSelectorProps<K>) {
  const { colors } = useTheme();
  const isDisplay = variant === 'display';
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const scrollActiveTabIntoView = useCallback(() => {
    const activeLayout = tabLayouts.current[String(activeKey)];
    if (!activeLayout || viewportWidth <= 0 || contentWidth <= viewportWidth) return;

    const centeredX = activeLayout.x + activeLayout.width / 2 - viewportWidth / 2;
    const maxX = Math.max(0, contentWidth - viewportWidth);
    scrollRef.current?.scrollTo({
      x: Math.max(0, Math.min(centeredX, maxX)),
      animated: true,
    });
  }, [activeKey, contentWidth, viewportWidth]);

  useEffect(() => {
    scrollActiveTabIntoView();
  }, [scrollActiveTabIntoView]);

  const handleTabLayout = useCallback(
    (key: K, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayouts.current[String(key)] = { x, width };
      if (key === activeKey) scrollActiveTabIntoView();
    },
    [activeKey, scrollActiveTabIntoView],
  );

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.void, borderTopColor: colors.frostBorder, borderBottomColor: colors.frostBorder },
        isDisplay && { borderTopWidth: 0, borderBottomColor: colors.frostDivider, paddingTop: 8 },
        style,
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.track, isDisplay && styles.trackDisplay]}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const isLocked = Boolean(item.locked);
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(item.key);
              }}
              onLayout={(event) => handleTabLayout(item.key, event)}
              style={[styles.tab, isDisplay && styles.tabDisplay]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                isLocked ? `${item.label}, locked` : item.label
              }
            >
              <View style={[styles.tabContent, isDisplay && styles.tabContentDisplay]}>
                {isLocked && (
                  <Lock
                    size={isDisplay ? 12 : 10}
                    color={
                      isActive
                        ? isDisplay
                          ? colors.brandVolt
                          : colors.textPrimary
                        : colors.textTertiary
                    }
                    strokeWidth={2.5}
                  />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    { color: colors.textSecondary },
                    isDisplay && styles.tabLabelDisplay,
                    isActive && { color: colors.textPrimary },
                    isActive && isDisplay && { color: colors.brandVolt },
                    isLocked && !isActive && { color: colors.textTertiary },
                  ]}
                >
                  {item.label.toUpperCase()}
                </Text>
              </View>
              {isActive && (
                <View style={[styles.underline, { backgroundColor: colors.textPrimary }, isDisplay && { backgroundColor: colors.brandVolt }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  track: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.gutter,
    gap: 28,
  },
  trackDisplay: {
    // display variant inherits track + extra padding from wrap override
  },
  tab: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabDisplay: {
    height: 46,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  tabContentDisplay: {
    paddingVertical: 8,
  },
  tabLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  tabLabelDisplay: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
});
