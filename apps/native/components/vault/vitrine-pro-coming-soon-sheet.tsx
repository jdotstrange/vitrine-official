import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { VITRINE_PRO_SHEET_BULLETS } from '@/lib/pro-ship-dark';

import { Button } from './button';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface VitrineProComingSoonSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Barebones explainer for Vitrine Pro while subscription is not shipping.
 * Opened from Pro teaser CTAs on collectible detail lenses and managed showcase.
 */
export function VitrineProComingSoonSheet({
  visible,
  onClose,
}: VitrineProComingSoonSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.scrim, { backgroundColor: colors.scrim }]}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + SPACING.zoneIntra,
              backgroundColor: colors.void,
              borderColor: colors.frostBorder,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleZone}>
            <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: colors.frostDivider }]}>
            <View style={styles.headerText}>
              <Text style={[styles.kicker, { color: colors.brandVolt }]}>VITRINE PRO</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Coming soon</Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.lead, { color: colors.textSecondary }]}>
              Vitrine Pro is the membership tier for collectors who want generated intelligence
              and smart collections on top of the free cataloging experience.
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              LAUNCHING WITH PRO
            </Text>
            {VITRINE_PRO_SHEET_BULLETS.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.brandVolt }]} />
                <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{line}</Text>
              </View>
            ))}

            <Text style={[styles.footnote, { color: colors.textTertiary }]}>
              Free tier at launch includes unlimited cataloging, curated showcases, comps, and
              sharing. Subscription checkout is not available yet.
            </Text>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.frostDivider }]}>
            <Button label="Got it" onPress={handleClose} variant="solid" fullWidth />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: RADII.card + 4,
    borderTopRightRadius: RADII.card + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    maxHeight: SCREEN_HEIGHT * 0.82,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: SPACING.zoneIntra,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 24,
    letterSpacing: 1.2,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    paddingBottom: SPACING.zoneIntra,
  },
  lead: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: SPACING.zoneCluster,
  },
  sectionLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.zoneIntra,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneIntra,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
