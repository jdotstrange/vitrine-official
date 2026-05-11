import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, X, Search } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SearchBar } from '@/components/search-bar';
import { TypeCard, TYPE_CARD_HEIGHT, type TypeItem, type CategoryItem } from '@/components/upload/type-card';
import { SubcategoryRow } from '@/components/upload/subcategory-row';
import { Skeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { useCategories } from '@/lib/contexts/category-context';
import { FALLBACK_TYPES } from '@/components/groups/fallback-types';
import type { CategoryType } from '@/lib/contexts/category-context';

export interface DiscoverFilterValue {
  typeCode: string;
  typeName: string;
  categoryCode?: string;
  categoryName?: string;
}

interface DiscoverFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: DiscoverFilterValue | null) => void;
}

type Step = 'type' | 'category';

function sortAlpha<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function toTypeItem(t: CategoryType): TypeItem {
  return {
    id: t.id,
    code: t.code,
    name: t.title,
    icon: t.icon,
    thumbnail: t.thumbnail || '',
    categories: t.categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.title,
    })),
  };
}

function toTypeItems(types: CategoryType[]): TypeItem[] {
  return types.map(toTypeItem);
}

export function DiscoverFilterModal({ visible, onClose, onApplyFilter }: DiscoverFilterModalProps) {
  const [step, setStep] = useState<Step>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TypeItem | null>(null);

  const { types: apiTypes, isLoading } = useCategories();
  const types = apiTypes.length > 0 ? toTypeItems(apiTypes) : toTypeItems(FALLBACK_TYPES);

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return sortAlpha(types);
    const q = searchQuery.toLowerCase();
    return sortAlpha(
      types.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.categories.some((c) => c.name.toLowerCase().includes(q))
      )
    );
  }, [types, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!selectedType) return [];
    if (!searchQuery.trim()) return sortAlpha(selectedType.categories);
    const q = searchQuery.toLowerCase();
    return sortAlpha(selectedType.categories.filter((c) => c.name.toLowerCase().includes(q)));
  }, [selectedType, searchQuery]);

  const handleTypeSelect = (type: TypeItem) => {
    setSelectedType(type);
    setSearchQuery('');
    setStep('category');
  };

  const handleAllType = () => {
    if (!selectedType) return;
    onApplyFilter({
      typeCode: selectedType.code,
      typeName: selectedType.name,
    });
    setStep('type');
    setSelectedType(null);
    setSearchQuery('');
    onClose();
  };

  const handleCategorySelect = (category: CategoryItem) => {
    if (!selectedType) return;
    onApplyFilter({
      typeCode: selectedType.code,
      typeName: selectedType.name,
      categoryCode: category.code,
      categoryName: category.name,
    });
    setStep('type');
    setSelectedType(null);
    setSearchQuery('');
    onClose();
  };

  const handleBack = () => {
    setStep('type');
    setSelectedType(null);
    setSearchQuery('');
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setSearchQuery('');
    onClose();
  };

  const showEmpty =
    !isLoading &&
    ((step === 'type' && filteredTypes.length === 0) ||
      (step === 'category' && filteredCategories.length === 0));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss filter"
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="none"
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {step === 'category' && (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Back to types"
                >
                  <ArrowLeft size={20} color={colors.foreground} />
                </TouchableOpacity>
              )}
              <Text style={styles.title} numberOfLines={1}>
                {step === 'type' ? 'Filter by category' : `Filter / ${selectedType?.name} /`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={
                step === 'type' ? 'Search types...' : 'Search categories...'
              }
              showClear
            />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              step === 'type' ? (
                <View style={styles.typeList}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      width="100%"
                      height={TYPE_CARD_HEIGHT}
                      borderRadius={16}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.skeletonRows}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.skeletonRow}>
                      <Skeleton width={180} height={18} borderRadius={6} />
                      <Skeleton width={20} height={20} borderRadius={4} />
                    </View>
                  ))}
                </View>
              )
            ) : step === 'type' ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.typeList}>
                {filteredTypes.map((type, index) => (
                  <TypeCard
                    key={type.id ?? `type-${type.code}-${index}`}
                    type={type}
                    index={index}
                    onSelect={() => handleTypeSelect(type)}
                  />
                ))}
              </Animated.View>
            ) : (
              <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
                <TouchableOpacity
                  style={styles.allRow}
                  onPress={handleAllType}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`All ${selectedType?.name} groups`}
                >
                  <Text style={styles.allRowText}>All {selectedType?.name} groups</Text>
                </TouchableOpacity>
                {filteredCategories.map((category, index) => (
                  <SubcategoryRow
                    key={`${selectedType?.code}-${category.id ?? category.code}-${index}`}
                    category={category}
                    index={index}
                    onSelect={() => handleCategorySelect(category)}
                  />
                ))}
              </Animated.View>
            )}

            {showEmpty && (
              <View style={styles.empty}>
                <Search size={32} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>
                  No results for &quot;{searchQuery}&quot;
                </Text>
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.emptyAction}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.gradientOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 448,
    maxHeight: '80%',
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  searchWrap: {
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  typeList: {
    gap: 12,
  },
  skeletonRows: {
    gap: 0,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allRow: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  allRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 24,
  },
});
