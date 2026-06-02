import { useCallback, useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';
import { colors } from '@/lib/colors';
import { getOptimizedUrl, getOriginalUrl, IMAGE_SIZES } from '@/lib/image-utils';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  src: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  /** Controls the Supabase transform width. Defaults to 'card' (400px). */
  displaySize?: keyof typeof IMAGE_SIZES | number;
}

export function OptimizedImage({
  src,
  alt,
  fill,
  width,
  height,
  style,
  displaySize = 'card',
  onError,
  ...props
}: OptimizedImageProps) {
  // If the transform fails (disabled/unsupported/latency), fall back to the
  // raw original so the image can never render blank.
  const [useOriginal, setUseOriginal] = useState(false);
  useEffect(() => setUseOriginal(false), [src]);

  const imageStyle: StyleProp<ImageStyle> = [
    { backgroundColor: colors.surface },
    fill ? StyleSheet.absoluteFillObject : undefined,
    width ? { width } : undefined,
    height ? { height } : undefined,
    style as ImageStyle,
  ];

  const transformWidth =
    typeof displaySize === 'number' ? displaySize : IMAGE_SIZES[displaySize];
  const optimizedSrc = getOptimizedUrl(src, transformWidth);
  const finalSrc = useOriginal ? getOriginalUrl(optimizedSrc) : optimizedSrc;

  const handleError = useCallback(
    (event: Parameters<NonNullable<ImageProps['onError']>>[0]) => {
      if (!useOriginal && finalSrc !== src) setUseOriginal(true);
      onError?.(event);
    },
    [useOriginal, finalSrc, src, onError],
  );

  return (
    <Image
      source={{ uri: finalSrc }}
      style={imageStyle}
      contentFit="cover"
      transition={200}
      recyclingKey={src}
      onError={handleError}
      {...props}
    />
  );
}
