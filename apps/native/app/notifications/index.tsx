/**
 * /notifications — standalone Activity surface.
 *
 * Mirrors the chrome of `/messages/share-collectible.tsx` (single-band
 * top bar with an oversized headline + back button on the left). The
 * body is the same `ActivityLens` mounted inside the profile-as-hub,
 * so both consumers stay locked to one surface contract.
 *
 * Reachable from:
 *   - The bell icon in the home screen top bar
 *   - Any deep-link to `/notifications`
 *
 * The legacy `components/notifications.tsx` has been retired in favor
 * of the V3 lens body.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { ActivityLens } from '@/components/profile-lenses';
import { IconButton } from '@/components/vault';
import { useTheme, TYPE } from '@/lib/design';

const HEADLINE = 'ACTIVITY';

export default function NotificationsPage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.frostDivider }]}>
        <Text style={[styles.headline, { color: colors.textPrimary }]} accessibilityRole="header">
          {HEADLINE}
        </Text>
        <View style={styles.leftSlot} pointerEvents="box-none">
          <IconButton
            icon={ArrowLeft}
            onPress={() => router.back()}
            label="Back"
            size={22}
          />
        </View>
      </View>
      <ActivityLens />
    </SafeAreaView>
  );
}

const TOP_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'relative',
    height: TOP_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  headline: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  leftSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    justifyContent: 'center',
  },
});
