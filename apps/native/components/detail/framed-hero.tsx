/**
 * FramedHero — shared paginated photo carousel with optional lightbox.
 *
 * Originally lived inline in `lenses/details-lens.tsx` as the visual
 * anchor for the DETAILS lens. Promoted to a shared component so the
 * upload Review screen can render the *exact same* hero — same chrome,
 * same carousel, same lightbox affordance — giving users a tight visual
 * preview of where their item will land in production.
 *
 * Visual model:
 *   - 4:5 photo well sitting in a 16pt gutter (void wraps the imagery).
 *   - frostBorder + sheetBg chrome.
 *   - Each slide stacks a blurred copy of the image (covers the well)
 *     under a contain-fit copy of the same image. The backdrop softens
 *     awkward aspect mismatches without ever cropping the subject.
 *   - Pagination dots beneath the frame; active dot is an expanded pill.
 *   - Tap the active slide to open a fullscreen lightbox (paginated +
 *     dismissible). Disable via `enableLightbox={false}` when the surface
 *     already provides its own zoom path.
 *
 * Notes:
 *   - Images are URLs that pass through `getOptimizedUrl`. Pure local
 *     URIs (e.g. mid-upload `file://` strings) are passed through
 *     unchanged by the optimizer, so this component is safe to use both
 *     pre- and post-upload.
 *   - This is a presentation component. It owns no domain state beyond
 *     carousel index + lightbox visibility.
 */

import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_GUTTER = SPACING.gutter;
const HERO_FRAME_WIDTH = SCREEN_W - HERO_GUTTER * 2;
const HERO_ASPECT = 4 / 5;
const HERO_FRAME_HEIGHT = HERO_FRAME_WIDTH / HERO_ASPECT;

export interface FramedHeroProps {
  /** Image URLs (or local URIs, pre-upload). Empty array shows placeholder. */
  images: string[];
  /**
   * Whether tapping a slide opens the fullscreen lightbox. Defaults to
   * true. Set false when the parent already handles zoom interactions.
   */
  enableLightbox?: boolean;
  /**
   * Controls which pre-generated variant width getOptimizedUrl targets.
   * Use `full` during upload Review/Finalize when variants are not built yet.
   */
  displaySize?: keyof typeof IMAGE_SIZES;
}

export function FramedHero({
  images,
  enableLightbox = true,
  displaySize = 'detail',
}: FramedHeroProps) {
  const transformWidth = IMAGE_SIZES[displaySize];
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const slides = images.length > 0 ? images : [null];
  const isPaginated = slides.length > 1;
  const hasImages = images.length > 0;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / HERO_FRAME_WIDTH);
    if (i !== activeIndex) setActiveIndex(i);
  };

  const handleSlidePress = () => {
    if (!enableLightbox || !hasImages) return;
    setLightboxOpen(true);
  };

  return (
    <View style={styles.heroWrap}>
      <View
        style={[
          styles.heroFrame,
          { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
        ]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={isPaginated}
          decelerationRate="fast"
          snapToInterval={HERO_FRAME_WIDTH}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {slides.map((img, i) => (
            <Pressable
              key={`${i}-${img ?? 'placeholder'}`}
              style={styles.heroSlide}
              onPress={handleSlidePress}
              disabled={!enableLightbox || !hasImages}
              accessibilityRole={enableLightbox && hasImages ? 'imagebutton' : 'image'}
              accessibilityLabel={
                enableLightbox && hasImages
                  ? `Photo ${i + 1} of ${slides.length}. Tap to view full size.`
                  : `Photo ${i + 1} of ${slides.length}`
              }
            >
              {img ? (
                <>
                  <Image
                    source={{ uri: getOptimizedUrl(img, transformWidth) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    blurRadius={50}
                    recyclingKey={`${img}-bg`}
                  />
                  <View style={styles.heroDarkenOverlay} pointerEvents="none" />
                  <Image
                    source={{ uri: getOptimizedUrl(img, transformWidth) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    transition={200}
                    recyclingKey={img}
                  />
                </>
              ) : (
                <Text style={[styles.heroPlaceholder, { color: colors.textTertiary }]}>—</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isPaginated ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colors.frostBorderStrong },
                  isActive && [
                    styles.dotActive,
                    { backgroundColor: colors.textPrimary },
                  ],
                ]}
              />
            );
          })}
        </View>
      ) : null}

      {enableLightbox && hasImages ? (
        <Lightbox
          visible={lightboxOpen}
          images={images}
          startIndex={activeIndex}
          displaySize={displaySize}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// LIGHTBOX — fullscreen paginated viewer. Tap chrome / swipe down to close.
// ---------------------------------------------------------------------------

function Lightbox({
  visible,
  images,
  startIndex,
  displaySize,
  onClose,
}: {
  visible: boolean;
  images: string[];
  startIndex: number;
  displaySize: keyof typeof IMAGE_SIZES;
  onClose: () => void;
}) {
  const transformWidth = IMAGE_SIZES[displaySize];
  const { colors } = useTheme();
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Re-sync the scroll position whenever the lightbox opens (the carousel
  // index may have changed since last open). Done on layout via the ref
  // callback instead of `contentOffset` because contentOffset doesn't
  // reliably honor the prop when paged scrollviews remount inside modals.
  React.useEffect(() => {
    if (visible && scrollViewRef) {
      setCurrentIndex(startIndex);
      // Defer to next frame so the ScrollView has measured.
      requestAnimationFrame(() => {
        scrollViewRef.scrollTo({ x: startIndex * SCREEN_W, animated: false });
      });
    }
  }, [visible, startIndex, scrollViewRef]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== currentIndex) setCurrentIndex(i);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.void} />
      <View style={[styles.lightboxRoot, { backgroundColor: colors.void }]}>
        <ScrollView
          ref={setScrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_W}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {images.map((img, i) => (
            <Pressable
              key={`lightbox-${i}-${img}`}
              style={styles.lightboxSlide}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close full-size view"
            >
              <Image
                source={{ uri: getOptimizedUrl(img, transformWidth) }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                transition={150}
                recyclingKey={`lightbox-${img}`}
              />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.lightboxTopBar} pointerEvents="box-none">
          <Pressable
            onPress={onClose}
            style={[
              styles.lightboxClose,
              { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textPrimary} />
          </Pressable>
          {images.length > 1 ? (
            <View
              style={[
                styles.lightboxCounter,
                { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
              ]}
            >
              <Text style={[styles.lightboxCounterText, { color: colors.textPrimary }]}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  heroWrap: {
    width: '100%',
  },
  heroFrame: {
    width: HERO_FRAME_WIDTH,
    height: HERO_FRAME_HEIGHT,
    marginHorizontal: HERO_GUTTER,
    borderRadius: RADII.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  heroSlide: {
    width: HERO_FRAME_WIDTH,
    height: HERO_FRAME_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDarkenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  heroPlaceholder: {
    fontFamily: TYPE.mono,
    fontSize: 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  // Inactive dot: solid filled circle on `frostBorderStrong` so the dot
  // reads as "present, dim" against the void instead of a hairline outline.
  // Active dot: filled ivory expanded pill — same width logic as before.
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },

  // Lightbox -----------------------------------------------------------
  lightboxRoot: {
    flex: 1,
  },
  lightboxSlide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.gutter,
    paddingTop: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCounter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lightboxCounterText: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
