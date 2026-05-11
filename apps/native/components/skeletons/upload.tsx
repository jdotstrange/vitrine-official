import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../skeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.56;

export function UploadEntrySkeleton() {
  return (
    <View style={s.root}>
      {/* Close button */}
      <View style={s.closeWrap}>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Title */}
      <View style={s.titleWrap}>
        <Skeleton width={220} height={38} borderRadius={8} />
        <Skeleton width={160} height={38} borderRadius={8} style={{ marginTop: 4 }} />
      </View>

      {/* Carousel card */}
      <View style={s.cardWrap}>
        <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={24} />
      </View>

      {/* Bottom link */}
      <View style={s.bottomWrap}>
        <Skeleton width={120} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  closeWrap: { paddingHorizontal: 20, paddingTop: 16 },
  titleWrap: { paddingHorizontal: 24, paddingTop: 12 },
  cardWrap: { alignItems: 'center', paddingTop: 24 },
  bottomWrap: { paddingHorizontal: 24, paddingTop: 20 },
});
