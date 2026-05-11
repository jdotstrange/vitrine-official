/**
 * Edit Rules screen — renders ManagedRuleBuilder in edit mode for an
 * existing managed showcase.
 *
 * Route: /upload/showcase/[id]/rules
 *
 * Loads the showcase's current rules from the API, lets the owner modify
 * them via the rule builder, and saves changes by calling
 * `updateShowcaseRules` which persists the new rules then blocks on
 * immediate re-evaluation so the user sees updated membership instantly.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';

import { mapToCollectionItem, type CollectionItem } from '@/components/collectibles';
import { ManagedRuleBuilder } from '@/components/managed-rule-builder';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserCollectibles } from '@/lib/api/collectibles';
import { getShowcaseById, updateShowcaseRules } from '@/lib/api/showcases';
import { getTrackCounts } from '@/lib/api/tracking';
import { type ManagedRules } from '@/lib/api/managed-rules';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('EditRules');

export default function EditRulesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id: showcaseId } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const [showcaseTitle, setShowcaseTitle] = useState('');
  const [rules, setRules] = useState<ManagedRules>({ match: 'all', conditions: [] });
  const [originalRules, setOriginalRules] = useState<ManagedRules>({ match: 'all', conditions: [] });
  const [collectibles, setCollectibles] = useState<CollectionItem[]>([]);

  useEffect(() => {
    let alive = true;
    if (!user?.id || !showcaseId) return;

    (async () => {
      try {
        const [showcase, rows] = await Promise.all([
          getShowcaseById(showcaseId),
          getUserCollectibles(user.id),
        ]);

        if (!alive) return;

        if (!showcase || !showcase.rules) {
          log.error('Showcase not found or not managed');
          setLoading(false);
          return;
        }

        setShowcaseTitle(showcase.title);
        setRules(showcase.rules);
        setOriginalRules(showcase.rules);

        const trackingCounts = await getTrackCounts(rows.map((r) => r.id));
        if (!alive) return;

        const mapped = rows.map((r) => mapToCollectionItem(r, trackingCounts.get(r.id) ?? 0));
        setCollectibles(mapped);
      } catch (err) {
        log.error('Failed to load showcase for rule editing:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [showcaseId, user?.id]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(rules) !== JSON.stringify(originalRules);
  }, [rules, originalRules]);

  const handleSave = useCallback(async () => {
    if (!showcaseId || !hasChanges || saving) return;
    setSaving(true);
    try {
      await updateShowcaseRules({ showcaseId, rules });
      setOriginalRules(rules);
      setToastVisible(true);
      setTimeout(() => {
        router.back();
      }, 1100);
    } catch (err) {
      log.error('Failed to save managed showcase rules:', err);
      setSaving(false);
    }
  }, [hasChanges, rules, router, saving, showcaseId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <Toast
        message="Rules updated"
        type="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={2400}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.frostDivider }]}>
        <Text style={[styles.headline, { color: colors.textPrimary }]} numberOfLines={1}>
          EDIT RULES
        </Text>
        <View style={styles.leftSlot} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            disabled={saving}
          >
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {showcaseTitle ? (
        <View style={[styles.titleBand, { borderBottomColor: colors.frostDivider }]}>
          <Text style={[styles.titleText, { color: colors.textSecondary }]} numberOfLines={1}>
            {showcaseTitle}
          </Text>
        </View>
      ) : null}

      <ManagedRuleBuilder
        rules={rules}
        onRulesChange={setRules}
        collectibles={collectibles}
      />

      {/* Footer CTA */}
      <SafeAreaView edges={['bottom']} style={[styles.footerWrap, { backgroundColor: colors.void, borderTopColor: colors.frostBorder }]}>
        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || saving}
            accessibilityRole="button"
            accessibilityLabel="Save rules"
            accessibilityState={{ disabled: !hasChanges || saving }}
            style={({ pressed }) => [
              styles.saveBtn,
              { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
              (!hasChanges || saving) && styles.saveBtnDisabled,
              pressed && hasChanges && !saving && { backgroundColor: colors.pressOverlay },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Check size={16} color={colors.textPrimary} strokeWidth={2.4} />
                <Text style={[styles.saveBtnText, { color: colors.textPrimary }]}>SAVE RULES</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: {
    position: 'relative',
    height: 54,
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleBand: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  footerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnPressed: {},
  saveBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.6,
  },
});
