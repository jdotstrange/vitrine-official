import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';

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
  ...props
}: OptimizedImageProps) {
  const imageStyle: StyleProp<ImageStyle> = [
    fill ? StyleSheet.absoluteFillObject : undefined,
    width ? { width } : undefined,
    height ? { height } : undefined,
    style as ImageStyle,
  ];

  const transformWidth =
    typeof displaySize === 'number' ? displaySize : IMAGE_SIZES[displaySize];
  const optimizedSrc = getOptimizedUrl(src, transformWidth);

  return (
    <Image
      source={{ uri: optimizedSrc }}
      style={imageStyle}
      contentFit="cover"
      transition={200}
      recyclingKey={src}
      {...props}
    />
  );
}
