import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * LensPager — swipeable horizontal pager for lens-based screen architectures.
 *
 * Partners with `LensSelector`: the selector renders the tab row and emits
 * `onChange(key)`; the pager renders the page bodies and emits `onIndexChange`.
 * Keep them in sync at the parent by holding the active index in state and
 * bridging tap + swipe through the parent's setter.
 *
 * Gesture contract:
 *   - activeOffsetX [-12, 12] on pages 1..N — bidirectional lens swipes.
 *   - On page 0 only, activeOffsetX [-12, ∞] — pager claims leftward swipes
 *     (next lens) but never rightward swipes, so the stack edge-back gesture
 *     is not stolen in the content band. There is no lens −1; rightward drag
 *     is reserved for navigation pop.
 *   - failOffsetY [-20, 20] — yields to vertical scroll inside each page.
 *   - Track translateX is clamped to [-(N-1)*width, 0] so overscroll at
 *     the ends is impossible; no rubber-band needed.
 *   - Commit threshold: velocity > 500 in a direction OR displacement >
 *     30% of page width. Otherwise snap back to the current page.
 *   - Haptic selection tick on every page commit (including programmatic).
 *
 * Motion:
 *   - Snap uses `withTiming` with the iOS-standard ease-out curve
 *     (`cubic-bezier(0.32, 0.72, 0, 1)`) — same curve UIKit uses for sheet
 *     presentation and the curve we use for swipe rows + the attach sheet.
 *     Smooth deceleration, zero overshoot. No bounce by design.
 *
 * Performance:
 *   - Worklet-first. Pan + snap run on the UI thread; the JS thread only
 *     hears about settled page changes.
 *   - Default mounting is eager (every page lives in the tree from first
 *     paint). For hub-style pagers (4+ lenses where each lens owns expensive
 *     state — live sockets, FlatLists, paginated APIs), pass `lazy` to mount
 *     only the active page + its immediate neighbors on first paint, with a
 *     sticky visited set so once a lens has been opened it stays mounted
 *     (preserves scroll position + data subscriptions across navigation).
 */

const PAGER_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const PAGER_TIMING = { duration: 280, easing: PAGER_EASING } as const;
/** Pan never activates on rightward drag at this threshold (page 0 only). */
const FIRST_PAGE_RIGHT_ACTIVE_OFFSET = 1_000_000;

export interface LensPagerHandle {
  setPage: (index: number, animated?: boolean) => void;
}

export interface LensPagerProps {
  /** Current page index. Drives imperative snaps when it changes externally. */
  index: number;
  /** Called when the user settles on a new page via swipe. */
  onIndexChange: (index: number) => void;
  /**
   * When true, only the active page and its immediate neighbors mount on
   * first paint. Pages stay mounted once visited (sticky window). Use for
   * hub pagers with many lenses where eager mounting is too expensive.
   * Default: false (back-compat with existing 3-lens screens).
   */
  lazy?: boolean;
  /** Page views — rendered in order. Must match the LensSelector items. */
  children: React.ReactNode;
}

export const LensPager = forwardRef<LensPagerHandle, LensPagerProps>(
  function LensPager({ index, onIndexChange, lazy = false, children }, ref) {
    const { width } = useWindowDimensions();
    const pages = React.Children.toArray(children);
    const pageCount = pages.length;

    const translateX = useSharedValue(-index * width);
    const startX = useSharedValue(0);

    // ── Sticky visited set ────────────────────────────────────────────
    // Tracks which pages have been entered. Once a page is in the set it
    // never leaves — keeps scroll position + data subscriptions intact
    // across lens hops. The set is seeded with the initial index ± 1 so
    // first paint always renders the active page and its immediate
    // swipe-neighbors.
    const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => {
      const seed = new Set<number>();
      seed.add(index);
      if (index - 1 >= 0) seed.add(index - 1);
      if (index + 1 < pageCount) seed.add(index + 1);
      return seed;
    });

    const markVisited = useCallback((i: number) => {
      setVisitedIndices((prev) => {
        if (prev.has(i)) return prev;
        const next = new Set(prev);
        next.add(i);
        return next;
      });
    }, []);

    // Commit a page change from the UI thread (worklet) — runs a haptic +
    // lifts state back to the caller on the JS thread.
    const commitPage = useCallback(
      (next: number) => {
        Haptics.selectionAsync();
        onIndexChange(next);
      },
      [onIndexChange]
    );

    // Sync external index changes (e.g., LensSelector tap) into the pager.
    // When the user taps a distant lens we mark every index along the path
    // as visited — otherwise the snap animation would visually pass through
    // empty placeholder slots between current and target.
    const prevIndexRef = useRef(index);
    useEffect(() => {
      const prev = prevIndexRef.current;
      if (prev !== index) {
        const start = Math.min(prev, index);
        const end = Math.max(prev, index);
        for (let i = start; i <= end; i++) markVisited(i);
      }
      // Always keep the active±1 window mounted.
      if (index - 1 >= 0) markVisited(index - 1);
      if (index + 1 < pageCount) markVisited(index + 1);

      prevIndexRef.current = index;
      translateX.value = withTiming(-index * width, PAGER_TIMING);
    }, [index, width, translateX, markVisited, pageCount]);

    useImperativeHandle(
      ref,
      () => ({
        setPage: (next: number, animated = true) => {
          const clamped = Math.max(0, Math.min(pageCount - 1, next));
          if (animated) {
            translateX.value = withTiming(-clamped * width, PAGER_TIMING);
          } else {
            translateX.value = -clamped * width;
          }
          if (clamped !== index) {
            Haptics.selectionAsync();
            onIndexChange(clamped);
          }
        },
      }),
      [pageCount, width, translateX, index, onIndexChange]
    );

    const pan = useMemo(
      () =>
        Gesture.Pan()
          // Page 0: only leftward movement activates the pager (next lens).
          // Rightward movement is left for the stack edge-back pop gesture.
          .activeOffsetX(
            index === 0 ? [-12, FIRST_PAGE_RIGHT_ACTIVE_OFFSET] : [-12, 12]
          )
          .failOffsetY([-20, 20])
          .onStart(() => {
            startX.value = translateX.value;
          })
          .onUpdate((e) => {
            const minX = -(pageCount - 1) * width;
            const next = startX.value + e.translationX;
            // Clamp — no overscroll past first/last page.
            translateX.value = Math.max(minX, Math.min(0, next));
          })
          .onEnd((e) => {
            const currentIndex = Math.round(-translateX.value / width);
            const velocityThreshold = 500;
            const positionThreshold = width * 0.3;
            const displacement = translateX.value - startX.value;

            let targetIndex = currentIndex;

            // Velocity-based commit wins over position-based.
            if (e.velocityX < -velocityThreshold) {
              targetIndex = Math.min(pageCount - 1, currentIndex + 1);
            } else if (e.velocityX > velocityThreshold) {
              targetIndex = Math.max(0, currentIndex - 1);
            } else if (Math.abs(displacement) > positionThreshold) {
              // Displacement past the commit line — advance one page in the
              // direction of travel.
              targetIndex =
                displacement < 0
                  ? Math.min(pageCount - 1, currentIndex + 1)
                  : Math.max(0, currentIndex - 1);
            }

            translateX.value = withTiming(-targetIndex * width, PAGER_TIMING);

            if (targetIndex !== index) {
              runOnJS(commitPage)(targetIndex);
            }
          }),
      [pageCount, width, translateX, startX, index, commitPage]
    );

    const trackStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const shouldRenderPage = useCallback(
      (i: number) => {
        if (!lazy) return true;
        if (visitedIndices.has(i)) return true;
        return Math.abs(i - index) <= 1;
      },
      [lazy, visitedIndices, index]
    );

    return (
      <GestureDetector gesture={pan}>
        <View style={styles.viewport}>
          <Animated.View
            style={[
              styles.track,
              { width: width * pageCount },
              trackStyle,
            ]}
          >
            {pages.map((page, i) => (
              <View key={i} style={{ width, flex: 1 }}>
                {shouldRenderPage(i) ? page : null}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
});
