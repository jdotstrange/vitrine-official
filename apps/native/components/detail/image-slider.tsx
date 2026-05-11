import React, { useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { AdaptiveImage } from '../adaptive-image';
import { colors } from '@/lib/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.25;

export interface ImageSliderProps {
  images: string[];
  imageIndex: number;
  statusTextColor: string;
  onImageIndexChange: (index: number) => void;
}

export function ImageSlider({
  images,
  imageIndex,
  statusTextColor,
  onImageIndexChange,
}: ImageSliderProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    onImageIndexChange(index);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.imageSlider}
        decelerationRate="fast"
        snapToInterval={IMAGE_WIDTH}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {images.map((img, index) => (
          <View key={index} style={styles.imageSlide}>
            <AdaptiveImage
              uri={img}
              targetAspectRatio={4 / 5}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
            />
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                scrollViewRef.current?.scrollTo({ x: index * IMAGE_WIDTH, animated: true });
                onImageIndexChange(index);
              }}
              style={[
                styles.paginationDot,
                index === imageIndex && [styles.paginationDotActive, { backgroundColor: statusTextColor }],
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to image ${index + 1}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
  },
  imageSlider: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageSlide: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  paginationDotActive: {
    width: 32,
    backgroundColor: colors.primary,
  },
});
