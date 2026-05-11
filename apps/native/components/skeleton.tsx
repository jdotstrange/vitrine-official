import React, { createContext, useContext, useEffect } from 'react';
import { View, StyleSheet, Dimensions, type ViewStyle, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIMMER_WIDTH = SCREEN_WIDTH * 2;
const SHIMMER_DURATION = 1200;

const SkeletonDriverContext = createContext<Animated.SharedValue<number> | null>(null);

export function SkeletonProvider({ children }: { children: React.ReactNode }) {
  const driver = useSharedValue(-SHIMMER_WIDTH);

  useEffect(() => {
    driver.value = withRepeat(
      withTiming(SHIMMER_WIDTH, { duration: SHIMMER_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  return (
    <SkeletonDriverContext.Provider value={driver}>
      {children}
    </SkeletonDriverContext.Provider>
  );
}

function useSkeletonDriver() {
  const ctx = useContext(SkeletonDriverContext);
  if (ctx) return ctx;

  const fallback = useSharedValue(-SHIMMER_WIDTH);
  useEffect(() => {
    fallback.value = withRepeat(
      withTiming(SHIMMER_WIDTH, { duration: SHIMMER_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);
  return fallback;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const driver = useSkeletonDriver();

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: driver.value }],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[colors.skeletonBase, colors.skeletonHighlight, colors.skeletonBase]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: SHIMMER_WIDTH, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

interface SkeletonCrossfadeProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  duration?: number;
}

export function SkeletonCrossfade({ loading, skeleton, children, duration = 300 }: SkeletonCrossfadeProps) {
  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <Animated.View
          key="skeleton"
          style={{ flex: 1 }}
          exiting={FadeOut.duration(duration)}
        >
          <SkeletonProvider>{skeleton}</SkeletonProvider>
        </Animated.View>
      ) : (
        <Animated.View
          key="content"
          style={{ flex: 1 }}
          entering={FadeIn.duration(duration)}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

// Legacy composed skeletons kept for backward compat during migration

export function SpatialCardSkeleton() {
  return (
    <View style={spatialStyles.container}>
      <View style={spatialStyles.card}>
        <Skeleton width="100%" height={0} borderRadius={0} style={spatialStyles.image} />
        <View style={spatialStyles.info}>
          <View style={spatialStyles.infoHeader}>
            <View style={spatialStyles.infoLeft}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={12} style={spatialStyles.itemSpacing} />
            </View>
            <View style={spatialStyles.infoRight}>
              <Skeleton width={70} height={16} />
              <Skeleton width={56} height={20} borderRadius={20} style={spatialStyles.itemSpacing} />
            </View>
          </View>
          <View style={spatialStyles.collector}>
            <View style={spatialStyles.collectorLeft}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={90} height={12} />
            </View>
            <Skeleton width={80} height={12} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={feedStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SpatialCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function GridCardSkeleton() {
  return (
    <View style={gridStyles.card}>
      <Skeleton width="100%" height={0} borderRadius={0} style={gridStyles.image} />
      <View style={gridStyles.content}>
        <Skeleton width="80%" height={13} />
        <View style={gridStyles.footer}>
          <Skeleton width={50} height={12} />
          <Skeleton width={40} height={12} />
        </View>
      </View>
    </View>
  );
}

export function CollectionGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={gridStyles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </View>
  );
}

const spatialStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  image: { aspectRatio: 4 / 5, backgroundColor: colors.skeletonBase },
  info: { padding: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLeft: { flex: 1, marginRight: 16 },
  infoRight: { alignItems: 'flex-end' },
  collector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  collectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemSpacing: { marginTop: 6 },
});

const feedStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 16 },
});

const gridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  card: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  image: { aspectRatio: 1, backgroundColor: colors.skeletonBase },
  content: { padding: 10, gap: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});

// Re-exports for backward compat
export {
  ConversationListSkeleton,
  MessageBubbleSkeleton,
  GroupCardSkeleton,
  GroupCardListSkeleton,
  MemberListSkeleton,
} from './skeleton-messaging';

export {
  RecentDMsSkeleton,
  ActivityHeartbeatSkeleton,
  HappeningNowSkeleton,
  ForYouSkeleton,
  NewThisWeekSkeleton,
} from './skeleton-community';
