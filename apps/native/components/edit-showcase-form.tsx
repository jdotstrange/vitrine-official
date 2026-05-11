import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Plus, Globe, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from './search-bar';
import { OptimizedImage } from './optimized-image';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserCollectibles, type CreateCollectibleResponse } from '@/lib/api/collectibles';
import { updateShowcase, getShowcaseCollectibleIds } from '@/lib/api/showcases';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { getTypeName } from '@/lib/collectible-types';
import { logger } from '@/lib/logger';

const log = logger.create('EditShowcase');
const PAGE_SIZE = 20;

type Step = 'details' | 'collectibles' | 'visibility';

function deriveStatus(forSale?: boolean | null, forTrade?: boolean | null): ListingStatus {
  if (forSale && forTrade) return 'SELL_TRADE';
  if (forSale) return 'FOR_SALE';
  if (forTrade) return 'FOR_TRADE';
  return 'NFST';
}

export default function EditShowcaseForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const showcaseId = params.id as string;
  const initialTitle = (params.title as string) || '';
  const initialDescription = (params.description as string) || '';
  const initialVisibility = ((params.visibility as 'public' | 'private') || 'public') as 'public' | 'private';

  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const [collectibles, setCollectibles] = useState<CreateCollectibleResponse[]>([]);
  const [collectiblesLoading, setCollectiblesLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const steps: Step[] = ['details', 'collectibles', 'visibility'];
  const currentStepIndex = steps.indexOf(step);

  const loadCollectibles = useCallback(async () => {
    if (!user?.id) return;
    setCollectiblesLoading(true);
    try {
      const data = await getUserCollectibles(user.id, { limit: PAGE_SIZE, offset: 0 });
      setCollectibles(data);
      setOffset(PAGE_SIZE);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load collectibles:', err);
    } finally {
      setCollectiblesLoading(false);
    }
  }, [user?.id]);

  const loadShowcaseItems = useCallback(async () => {
    if (!showcaseId) return;
    try {
      const ids = await getShowcaseCollectibleIds(showcaseId);
      setSelectedIds(ids);
    } catch (err) {
      log.error('Failed to load showcase items:', err);
    }
  }, [showcaseId]);

  useEffect(() => {
    Promise.all([loadCollectibles(), loadShowcaseItems()]).finally(() => {
      setInitialLoading(false);
    });
  }, [loadCollectibles, loadShowcaseItems]);

  const loadMoreCollectibles = useCallback(async () => {
    if (!user?.id || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await getUserCollectibles(user.id, { limit: PAGE_SIZE, offset });
      setCollectibles((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const unique = more.filter((c) => !existingIds.has(c.id));
        return [...prev, ...unique];
      });
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(more.length >= PAGE_SIZE);
    } catch (err) {
      log.error('Failed to load more collectibles:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.id, hasMore, loadingMore, offset]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(collectibles.map((c) => c.category || '').filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [collectibles]);

  const filteredCollectibles = useMemo(() => {
    return collectibles.filter((c) => {
      const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || (c.category || '') === filterType;
      return matchesSearch && matchesType;
    });
  }, [collectibles, searchQuery, filterType]);

  const selectedCollectibles = useMemo(() => {
    return collectibles.filter((c) => selectedIds.includes(c.id));
  }, [collectibles, selectedIds]);

  const totalValue = useMemo(() => {
    const total = selectedCollectibles.reduce((sum, c) => {
      const v = typeof c.value === 'number' ? c.value : parseFloat(String(c.value)) || 0;
      return sum + v;
    }, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${Math.round(total)}`;
  }, [selectedCollectibles]);

  const toggleCollectible = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!showcaseId || saving) return;
    setSaving(true);
    try {
      await updateShowcase({
        showcaseId,
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        collectibleIds: selectedIds,
      });
      router.back();
    } catch (err) {
      log.error('Failed to save showcase:', err);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    } else {
      router.back();
    }
  };

  const renderCollectibleItem = ({ item }: { item: CreateCollectibleResponse }) => {
    const isSelected = selectedIds.includes(item.id);
    const status = deriveStatus(item.availableForSale, item.availableForTrade);
    const statusConfig = getStatusConfig(status);
    const numericValue = typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0;
    const formattedValue = numericValue > 0 ? `$${numericValue.toLocaleString()}` : '';

    return (
      <TouchableOpacity
        onPress={() => toggleCollectible(item.id)}
        style={[styles.collectibleItem, isSelected && styles.collectibleItemSelected]}
        activeOpacity={0.7}
      >
        <View style={styles.collectibleImageContainer}>
          <OptimizedImage
            src={item.photos?.[0] || ''}
            style={styles.collectibleImage}
            displaySize="thumbnail"
          />
        </View>
        <View style={styles.collectibleInfo}>
          <Text style={styles.collectibleName} numberOfLines={1}>{item.title}</Text>
          <View style={styles.collectibleMeta}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.short}</Text>
            {formattedValue ? (
              <Text style={styles.collectibleValue}>{formattedValue}</Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && { backgroundColor: colors.primary }]}>
          {isSelected ? (
            <Check size={14} color={colors.background} />
          ) : (
            <Plus size={14} color={colors.mutedForeground} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <View style={styles.stepContent}>
            <View style={styles.typeRow}>
              <View style={styles.typeBadge}>
                <View style={[styles.typeDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.typeText}>Manual Showcase</Text>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>SHOWCASE NAME</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter showcase name"
                placeholderTextColor={colors.mutedForeground}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'collectibles':
        return (
          <View style={styles.stepContent}>
            <View style={styles.searchSection}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search your collection..."
                showClear
              />
            </View>

            {uniqueTypes.length > 2 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContainer}
              >
                {uniqueTypes.map((type) => {
                  const active = filterType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFilterType(type)}
                      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                        {type === 'all' ? 'All' : getTypeName(type)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryHighlight}>{selectedIds.length}</Text> collectibles selected
              </Text>
              <Text style={styles.summaryText}>
                Value: <Text style={styles.summaryHighlight}>{totalValue}</Text>
              </Text>
            </View>

            {collectiblesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your collection...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCollectibles}
                renderItem={renderCollectibleItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.collectiblesGrid}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreCollectibles}
                onEndReachedThreshold={0.3}
                ListFooterComponent={loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 16 }} />
                ) : null}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No items found</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery ? 'Try a different search' : 'Add collectibles to your collection first'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        );

      case 'visibility':
        return (
          <View style={styles.stepContent}>
            <View style={styles.field}>
              <Text style={styles.label}>VISIBILITY</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity
                  onPress={() => setVisibility('public')}
                  style={[styles.visibilityOption, visibility === 'public' && styles.visibilityOptionActive]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.visibilityIcon, visibility === 'public' && styles.visibilityIconActive]}>
                    <Globe size={20} color={visibility === 'public' ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={styles.visibilityContent}>
                    <Text style={styles.visibilityTitle}>Public</Text>
                    <Text style={styles.visibilitySubtitle}>Anyone can view this showcase</Text>
                  </View>
                  {visibility === 'public' && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setVisibility('private')}
                  style={[styles.visibilityOption, visibility === 'private' && styles.visibilityOptionActive]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.visibilityIcon, visibility === 'private' && styles.visibilityIconActive]}>
                    <Lock size={20} color={visibility === 'private' ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={styles.visibilityContent}>
                    <Text style={styles.visibilityTitle}>Private</Text>
                    <Text style={styles.visibilitySubtitle}>Only you can view this showcase</Text>
                  </View>
                  {visibility === 'private' && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.finalSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Collectibles</Text>
                <Text style={styles.summaryValue}>{selectedIds.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Value</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalValue}</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Showcase</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            {steps.map((s, i) => (
              <View key={s} style={[styles.progressStep, i <= currentStepIndex && styles.progressStepActive]} />
            ))}
          </View>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {steps.length}: {step}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {renderStep()}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerOverlay} />
        <TouchableOpacity
          onPress={handleNext}
          disabled={(step === 'details' && !title.trim()) || saving}
          style={[
            styles.saveButton,
            ((step === 'details' && !title.trim()) || saving) && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? 'Saving...'
              : currentStepIndex === steps.length - 1
                ? 'Save Changes'
                : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 50,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 45, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  progress: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textTransform: 'capitalize',
  },
  stepContent: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    fontSize: 16,
    color: colors.foreground,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  searchSection: {
    marginBottom: 4,
  },
  chipsScroll: {
    maxHeight: 40,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.background,
  },
  chipTextInactive: {
    color: colors.mutedForeground,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  summaryHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  collectiblesGrid: {
    gap: 8,
    paddingBottom: 16,
  },
  collectibleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  collectibleItemSelected: {
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '4D',
  },
  collectibleImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  collectibleImage: {
    width: '100%',
    height: '100%',
  },
  collectibleInfo: {
    flex: 1,
    gap: 2,
  },
  collectibleName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  collectibleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  collectibleValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  visibilityOptions: {
    gap: 12,
    marginTop: 8,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  visibilityOptionActive: {
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '4D',
  },
  visibilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityIconActive: {
    backgroundColor: colors.primary + '33',
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 2,
  },
  visibilitySubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  finalSummary: {
    marginTop: 'auto',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  footer: {
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    padding: 16,
  },
  footerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
