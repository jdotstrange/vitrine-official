import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/lib/colors';
import { getOptimizedUrl, getOriginalUrl, IMAGE_SIZES } from '@/lib/image-utils';

const AR_DEVIATION_THRESHOLD = 0.25;
const BLUR_RADIUS = 30;

interface AdaptiveImageProps {
  uri: string;
  /** w/h ratio of the container (e.g. 4/5 = 0.8) */
  targetAspectRatio: number;
  /** Fixed pixel width — when provided, height is derived from targetAspectRatio */
  width?: number;
  /** Fixed pixel height — when provided alongside width, overrides aspect calculation */
  height?: number;
  style?: ViewStyle;
  /** Controls the Supabase transform width. Defaults to 'card' (400px). */
  displaySize?: keyof typeof IMAGE_SIZES | number;
}

export function AdaptiveImage({
  uri,
  targetAspectRatio,
  width: fixedWidth,
  height: fixedHeight,
  style,
  displaySize = 'card',
}: AdaptiveImageProps) {
  const [needsBlurFill, setNeedsBlurFill] = useState(false);
  // Fall back to the raw original if the transform fails — never render blank.
  const [useOriginal, setUseOriginal] = useState(false);
  useEffect(() => setUseOriginal(false), [uri]);

  const transformWidth =
    typeof displaySize === 'number' ? displaySize : IMAGE_SIZES[displaySize];
  const optimizedUri = getOptimizedUrl(uri, transformWidth);
  const displayUri = useOriginal ? getOriginalUrl(optimizedUri) : optimizedUri;

  const handleError = useCallback(() => {
    if (!useOriginal && displayUri !== uri) setUseOriginal(true);
  }, [useOriginal, displayUri, uri]);

  const handleLoad = useCallback(
    (event: { source: { width: number; height: number } }) => {
      const { width: srcW, height: srcH } = event.source;
      if (!srcW || !srcH) return;

      const sourceAR = srcW / srcH;
      const deviation = Math.abs(sourceAR - targetAspectRatio) / targetAspectRatio;
      setNeedsBlurFill(deviation > AR_DEVIATION_THRESHOLD);
    },
    [targetAspectRatio]
  );

  const containerStyle: ViewStyle = {
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...(fixedWidth ? { width: fixedWidth } : {}),
    ...(fixedHeight ? { height: fixedHeight } : {}),
    ...(!fixedWidth && !fixedHeight ? { width: '100%', aspectRatio: targetAspectRatio } : {}),
    ...(!fixedHeight && fixedWidth ? { height: fixedWidth / targetAspectRatio } : {}),
  };

  return (
    <View style={[containerStyle, style]} pointerEvents="none">
      {needsBlurFill && (
        <Image
          source={{ uri: displayUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={BLUR_RADIUS}
          recyclingKey={uri}
        />
      )}

      <Image
        source={{ uri: displayUri }}
        style={StyleSheet.absoluteFill}
        contentFit={needsBlurFill ? 'contain' : 'cover'}
        transition={200}
        onLoad={handleLoad}
        onError={handleError}
        recyclingKey={uri}
        accessibilityLabel="Collectible image"
      />
    </View>
  );
}
