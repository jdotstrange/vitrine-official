/**
 * ShowcaseReview — V3 finalize screen for the Create Showcase flow.
 *
 * Receives the selected collectible ids from the create surface (via
 * the `ids` query param) and lets the user name the showcase, write an
 * optional description, set visibility (Public / Private), and confirm
 * creation. On success a Toast confirms the action and the user is
 * bounced to the profile hub Showcase lens — no dedicated success
 * screen, no extra dismiss step.
 *
 * The summary panel (item count, total value, 3-up thumbnail strip)
 * mirrors the showcase-detail-v3 dossier vocabulary on purpose: the
 * user is previewing what the new showcase will look like once it
 * lands on their profile.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Globe, Lock } from 'lucide-react-native';

import { formatPrice } from '@/components/collectibles';
import { IconButton } from '@/components/vault';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserCollectibles } from '@/lib/api/collectibles';
import { createShowcase, previewRuleMatches } from '@/lib/api/showcases';
import { formatRulesSummary, type ManagedRules } from '@/lib/api/managed-rules';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('ShowcaseReview');

const HEADLINE = 'REVIEW';

function deriveStatusForReview(sale?: boolean, trade?: boolean): string {
  if (sale && trade) return 'SELL_TRADE';
  if (sale) return 'FOR_SALE';
  if (trade) return 'FOR_TRADE';
  return 'NFST';
}
const TITLE_MAX = 50;
const DESCRIPTION_MAX = 200;

const TOAST_DWELL_MS = 1100;

type Visibility = 'public' | 'private';

interface SelectedSummary {
  id: string;
  image: string | null;
  value: number;
}

export function ShowcaseReview() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ ids?: string; mode?: string; rules?: string }>();

  const flowMode: 'curated' | 'managed' = params.mode === 'managed' ? 'managed' : 'curated';

  const selectedIds = useMemo<string[]>(() => {
    if (!params.ids) return [];
    return params.ids
      .split(',')
      .map((id) => decodeURIComponent(id.trim()))
      .filter(Boolean);
  }, [params.ids]);

  const managedRules = useMemo<ManagedRules | null>(() => {
    if (flowMode !== 'managed' || !params.rules) return null;
    try {
      return JSON.parse(atob(decodeURIComponent(params.rules))) as ManagedRules;
    } catch {
      log.error('Failed to decode managed rules from route params');
      return null;
    }
  }, [flowMode, params.rules]);

  const [summaries, setSummaries] = useState<SelectedSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  const [creating, setCreating] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (flowMode === 'managed' && managedRules) {
      (async () => {
        try {
          const rows = await getUserCollectibles(user.id);
          if (!alive) return;

          const preview = previewRuleMatches(
            rows.map((r) => ({
              id: r.id,
              title: r.listingTitle || r.title || 'Untitled',
              collectibleType: (r.collectibleType as string) || 'unknown',
              value: typeof r.value === 'number' ? r.value : null,
              status: deriveStatusForReview(r.availableForSale, r.availableForTrade),
              traits: r.traits || [],
              image: r.photos?.[0] ?? undefined,
            })),
            managedRules,
          );

          const matchSet = new Set(preview.matchingIds);
          const next: SelectedSummary[] = rows
            .filter((r) => matchSet.has(r.id))
            .map((r) => ({
              id: r.id,
              image: r.photos?.[0] ?? null,
              value: typeof r.value === 'number' ? r.value : 0,
            }));
          setSummaries(next);
        } catch (err) {
          log.error('Failed to load collectibles for managed review:', err);
        } finally {
          if (alive) setLoading(false);
        }
      })();
    } else if (selectedIds.length > 0) {
      (async () => {
        try {
          const rows = await getUserCollectibles(user.id);
          if (!alive) return;
          const idSet = new Set(selectedIds);
          const next: SelectedSummary[] = rows
            .filter((r) => idSet.has(r.id))
            .map((r) => ({
              id: r.id,
              image: r.photos?.[0] ?? null,
              value: typeof r.value === 'number' ? r.value : 0,
            }));
          setSummaries(next);
        } catch (err) {
          log.error('Failed to load selected collectibles for review:', err);
        } finally {
          if (alive) setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [flowMode, managedRules, selectedIds, user?.id]);

  const totalValue = useMemo(
    () => summaries.reduce((sum, s) => sum + s.value, 0),
    [summaries],
  );

  const previewImages = useMemo(
    () => summaries.map((s) => s.image).filter((u): u is string => !!u).slice(0, 3),
    [summaries],
  );

  const canCreate =
    title.trim().length > 0 &&
    !creating &&
    (flowMode === 'curated' ? selectedIds.length > 0 : managedRules != null);

  const handleCreate = useCallback(async () => {
    if (!user?.id || !canCreate) return;
    setCreating(true);
    try {
      if (flowMode === 'managed' && managedRules) {
        await createShowcase({
          type: 'managed',
          userId: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
          rules: managedRules,
        });
      } else {
        await createShowcase({
          type: 'manual',
          userId: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
          collectibleIds: selectedIds,
        });
      }
      setToastVisible(true);
      setTimeout(() => {
        router.replace('/(tabs)?lens=SHOWCASE' as Href);
      }, TOAST_DWELL_MS);
    } catch (err) {
      log.error('Failed to create showcase:', err);
      setCreating(false);
    }
  }, [canCreate, description, flowMode, managedRules, router, selectedIds, title, user?.id, visibility]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <Toast
        message="Showcase created"
        type="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={2400}
      />

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
            disabled={creating}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SHOWCASE TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. My Grails, For Sale"
              placeholderTextColor={colors.textTertiary}
              maxLength={TITLE_MAX}
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
              editable={!creating}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {title.length}/{TITLE_MAX}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              DESCRIPTION{' '}
              <Text style={[styles.labelOptional, { color: colors.textTertiary }]}>(OPTIONAL)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell others about this showcase…"
              placeholderTextColor={colors.textTertiary}
              maxLength={DESCRIPTION_MAX}
              multiline
              numberOfLines={3}
              style={[styles.textArea, { color: colors.textPrimary, backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
              editable={!creating}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {description.length}/{DESCRIPTION_MAX}
            </Text>
          </View>

          {/* Visibility */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>VISIBILITY</Text>
            <View style={styles.visibilityRow}>
              <VisibilityCard
                active={visibility === 'public'}
                onPress={() => setVisibility('public')}
                disabled={creating}
                icon={Globe}
                title="Public"
                body="Anyone can view"
              />
              <VisibilityCard
                active={visibility === 'private'}
                onPress={() => setVisibility('private')}
                disabled={creating}
                icon={Lock}
                title="Private"
                body="Only you can view"
              />
            </View>
          </View>

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
            <View style={[styles.summaryAccentRail, { backgroundColor: colors.brandVolt }]} />
            <Text style={[styles.summaryKicker, { color: colors.textSecondary }]}>SHOWCASE SUMMARY</Text>

            {loading ? (
              <View style={styles.summaryLoading}>
                <ActivityIndicator color={colors.textSecondary} />
              </View>
            ) : (
              <>
                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>ITEMS</Text>
                    <Text style={[styles.summaryStatValue, { color: colors.textPrimary }]}>
                      {selectedIds.length}
                    </Text>
                  </View>
                  <View style={[styles.summaryStatDivider, { backgroundColor: colors.frostDivider }]} />
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatLabel, { color: colors.textTertiary }]}>EST. VALUE</Text>
                    <Text style={[styles.summaryStatValue, { color: colors.textPrimary }]}>
                      {formatPrice(totalValue)}
                    </Text>
                  </View>
                </View>

                <View style={styles.thumbStrip}>
                  {[0, 1, 2].map((i) => {
                    const uri = previewImages[i];
                    return (
                      <View key={i} style={[styles.thumbTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={styles.thumbImage}
                            contentFit="cover"
                            transition={150}
                          />
                        ) : (
                          <View style={styles.thumbPlaceholder} />
                        )}
                      </View>
                    );
                  })}
                </View>

                {flowMode === 'managed' && managedRules && (
                  <Text style={[styles.rulesSummary, { color: colors.textSecondary }]}>
                    {formatRulesSummary(managedRules)}
                  </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <SafeAreaView edges={['bottom']} style={[styles.footerWrap, { backgroundColor: colors.void, borderTopColor: colors.frostBorder }]}>
          <View style={styles.footer}>
            <Pressable
              onPress={handleCreate}
              disabled={!canCreate}
              accessibilityRole="button"
              accessibilityLabel="Create showcase"
              accessibilityState={{ disabled: !canCreate }}
              style={({ pressed }) => [
                styles.createBtn,
                { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                !canCreate && styles.createBtnDisabled,
                pressed && canCreate && { backgroundColor: colors.pressOverlay },
              ]}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Check size={16} color={colors.textPrimary} strokeWidth={2.4} />
                  <Text style={[styles.createBtnText, { color: colors.textPrimary }]}>CREATE SHOWCASE</Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════
// VISIBILITY CARD
// ════════════════════════════════════════════════════════════════

function VisibilityCard({
  active,
  disabled,
  onPress,
  icon: Icon,
  title,
  body,
}: {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  icon: typeof Globe;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={`${title} — ${body}`}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.visibilityCard,
        { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
        pressed && !active && { backgroundColor: colors.pressOverlay },
        disabled && styles.visibilityCardDisabled,
      ]}
    >
      <View
        style={[
          styles.visibilityIconWrap,
          { borderColor: colors.frostBorder },
          active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.void },
        ]}
      >
        <Icon
          size={18}
          color={active ? colors.brandVolt : colors.textSecondary}
          strokeWidth={2}
        />
      </View>
      <Text
        style={[styles.visibilityTitle, { color: colors.textPrimary }, active && { color: colors.brandVolt }]}
      >
        {title}
      </Text>
      <Text style={[styles.visibilityBody, { color: colors.textSecondary }]}>{body}</Text>
    </Pressable>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const TOP_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // Top bar
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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },

  // Field
  field: {
    gap: 8,
  },
  label: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  labelOptional: {
    fontFamily: TYPE.groteskSemiBold,
  },
  input: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    textAlign: 'right',
  },

  // Visibility
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: RADII.small,
    borderWidth: 1,
    gap: 6,
  },
  visibilityCardDisabled: {
    opacity: 0.5,
  },
  visibilityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  visibilityTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 14,
  },
  visibilityBody: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },

  // Summary
  summaryCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: RADII.card,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 18,
  },
  summaryAccentRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  summaryKicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  summaryLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    gap: 4,
  },
  summaryStatLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  summaryStatValue: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 20,
    letterSpacing: 1.1,
  },
  summaryStatDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: 16,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbTile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: RADII.small,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  rulesSummary: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  // Footer
  footerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  createBtnDisabled: {
    opacity: 0.45,
  },
  createBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.6,
  },
});
