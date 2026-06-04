import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

import { DARK_COLORS } from '@vitrine/design-tokens';
import {
  getContainRect,
  SPLASH_BG,
  SPLASH_SOURCE,
} from '@/lib/splash-contain-layout';

/** Gap between splash art bottom and the loading indicator (px). */
const LOADER_GAP = 28;
const PROGRESS_TRACK_W = 120;
const PROGRESS_H = 2;

/**
 * VitrineBootScreen — seamless post-splash loading state.
 *
 * Uses the same PNG, background, and contain layout as the native splash so only
 * the loading indicator appears underneath; the art does not move or rescale.
 */
export function VitrineBootScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const progress = useSharedValue(0);
  const loaderOpacity = useSharedValue(0);

  const splashRect = useMemo(() => {
    const assetW = SPLASH_SOURCE.width ?? 1;
    const assetH = SPLASH_SOURCE.height ?? 1;
    return getContainRect(screenW, screenH, assetW, assetH);
  }, [screenW, screenH]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    loaderOpacity.value = withDelay(
      180,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) }),
    );
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [loaderOpacity, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: 20 + progress.value * (PROGRESS_TRACK_W - 20),
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
    top: splashRect.top + splashRect.height + LOADER_GAP,
  }));

  return (
    <View style={styles.root}>
      <Image
        source={SPLASH_SOURCE}
        style={[
          styles.splashImage,
          {
            left: splashRect.left,
            top: splashRect.top,
            width: splashRect.width,
            height: splashRect.height,
          },
        ]}
        resizeMode="contain"
        accessibilityLabel="Vitrine"
      />

      <Animated.View
        style={[styles.loader, loaderStyle]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: DARK_COLORS.frostDivider },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: DARK_COLORS.brandVolt },
              progressStyle,
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  splashImage: {
    position: 'absolute',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressTrack: {
    width: PROGRESS_TRACK_W,
    height: PROGRESS_H,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});
