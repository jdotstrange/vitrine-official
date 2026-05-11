import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Watch,
  Footprints,
  Trophy,
  Gamepad2,
  Music,
  Clapperboard,
  Car,
  Sparkles,
  CircleDot,
} from 'lucide-react-native';
import { SearchBar } from './search-bar';
import { Skeleton } from './skeleton';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { getCategoryTree } from '@/lib/api/categories';
import { getIconForCategory } from '@/lib/icon-mapper';
import { ApiException } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TypeCard, TYPE_CARD_HEIGHT, type TypeItem, type CategoryItem } from './upload/type-card';
import { SubcategoryRow } from './upload/subcategory-row';

const log = logger.create('MemorabiliaType');

const FALLBACK_TYPES = [
  { id: 'automotive', name: 'Automotive', icon: Car, categories: [
    { id: 'diecast', name: 'Diecast Models' }, { id: 'parts', name: 'Parts & Badges' },
    { id: 'signed', name: 'Signed Items' }, { id: 'memorabilia', name: 'Memorabilia' },
  ]},
  { id: 'baseball', name: 'Baseball', icon: CircleDot, categories: [
    { id: 'bat', name: 'Bat' }, { id: 'glove', name: 'Glove' }, { id: 'helmet', name: 'Helmet' },
    { id: 'jersey', name: 'Jersey' }, { id: 'memorabilia', name: 'Other' },
    { id: 'ball', name: 'Signed Ball' }, { id: 'photo', name: 'Signed Photo' },
  ]},
  { id: 'basketball', name: 'Basketball', icon: CircleDot, categories: [
    { id: 'jersey', name: 'Jersey' }, { id: 'memorabilia', name: 'Other' },
    { id: 'ball', name: 'Signed Ball' }, { id: 'photo', name: 'Signed Photo' }, { id: 'shoes', name: 'Sneakers' },
  ]},
  { id: 'football', name: 'Football', icon: CircleDot, categories: [
    { id: 'helmet', name: 'Helmet' }, { id: 'jersey', name: 'Jersey' },
    { id: 'memorabilia', name: 'Other' }, { id: 'ball', name: 'Signed Ball' },
  ]},
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, categories: [
    { id: 'console', name: 'Console' }, { id: 'controller', name: 'Controller' },
    { id: 'handheld', name: 'Handheld' }, { id: 'memorabilia', name: 'Memorabilia' }, { id: 'sealed-game', name: 'Sealed Game' },
  ]},
  { id: 'hockey', name: 'Hockey', icon: Trophy, categories: [
    { id: 'helmet', name: 'Helmet' }, { id: 'jersey', name: 'Jersey' }, { id: 'memorabilia', name: 'Other' },
    { id: 'puck', name: 'Signed Puck' }, { id: 'photo', name: 'Signed Photo' }, { id: 'stick', name: 'Stick' },
  ]},
  { id: 'movies', name: 'Movies & TV', icon: Clapperboard, categories: [
    { id: 'costumes', name: 'Costumes' }, { id: 'memorabilia', name: 'Memorabilia' },
    { id: 'posters', name: 'Posters' }, { id: 'props', name: 'Props' }, { id: 'signed', name: 'Signed Items' },
  ]},
  { id: 'music', name: 'Music', icon: Music, categories: [
    { id: 'concert', name: 'Concert Items' }, { id: 'instrument', name: 'Instruments' },
    { id: 'memorabilia', name: 'Other' }, { id: 'signed', name: 'Signed Items' }, { id: 'vinyl', name: 'Vinyl Records' },
  ]},
  { id: 'sneakers', name: 'Sneakers', icon: Footprints, categories: [
    { id: 'adidas', name: 'Adidas' }, { id: 'jordan', name: 'Jordan' }, { id: 'new-balance', name: 'New Balance' },
    { id: 'nike', name: 'Nike' }, { id: 'other', name: 'Other Brand' }, { id: 'yeezy', name: 'Yeezy' },
  ]},
  { id: 'soccer', name: 'Soccer', icon: CircleDot, categories: [
    { id: 'cleats', name: 'Cleats' }, { id: 'jersey', name: 'Jersey' }, { id: 'memorabilia', name: 'Other' },
    { id: 'ball', name: 'Signed Ball' }, { id: 'photo', name: 'Signed Photo' },
  ]},
  { id: 'toys', name: 'Toys & Figures', icon: Sparkles, categories: [
    { id: 'action-figures', name: 'Action Figures' }, { id: 'funko', name: 'Funko Pop' },
    { id: 'lego', name: 'LEGO' }, { id: 'other', name: 'Other' }, { id: 'vintage', name: 'Vintage Toys' },
  ]},
  { id: 'watches', name: 'Watches', icon: Watch, categories: [
    { id: 'ap', name: 'Audemars Piguet' }, { id: 'cartier', name: 'Cartier' }, { id: 'omega', name: 'Omega' },
    { id: 'other', name: 'Other Brand' }, { id: 'patek', name: 'Patek Philippe' }, { id: 'rolex', name: 'Rolex' },
  ]},
];

function sortAlpha<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

type Step = 'type' | 'category';

interface SelectedType {
  id: string;
  code: string;
  name: string;
  categories: CategoryItem[];
}

export function MemorabiliaTypeSelector() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SelectedType | null>(null);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const tree = await getCategoryTree();

        const transformedTypes: TypeItem[] = tree.types.map((type) => ({
          id: type.id,
          code: type.code,
          name: type.title,
          icon: getIconForCategory(type.code),
          thumbnail: type.thumbnail || '',
          categories: type.categories.map((cat) => ({
            id: cat.id,
            code: cat.code,
            name: cat.title,
          })),
        }));

        setTypes(transformedTypes);
      } catch (err) {
        log.error('Failed to fetch categories:', err);
        const errorMessage = err instanceof ApiException
          ? err.message
          : 'Failed to load categories. Please check your connection and try again.';
        setError(errorMessage);

        setTypes(FALLBACK_TYPES.map((type) => ({
          id: type.id,
          code: type.id,
          name: type.name,
          icon: type.icon,
          thumbnail: '',
          categories: type.categories.map((cat) => ({
            id: cat.id,
            code: cat.id,
            name: cat.name,
          })),
        })));

        Alert.alert('Connection Error', errorMessage + '\n\nUsing offline data for now.', [{ text: 'OK' }]);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const filteredTypes = useMemo(() => {
    const base = searchQuery
      ? types.filter((type) => {
          const q = searchQuery.toLowerCase();
          return type.name.toLowerCase().includes(q) ||
            type.categories.some((cat) => cat.name.toLowerCase().includes(q));
        })
      : types;
    return sortAlpha(base);
  }, [types, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!selectedType) return [];
    const base = searchQuery
      ? selectedType.categories.filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : selectedType.categories;
    return sortAlpha(base);
  }, [selectedType, searchQuery]);

  const handleTypeSelect = (type: TypeItem) => {
    setSelectedType({ id: type.id, code: type.code, name: type.name, categories: type.categories });
    setSearchQuery('');
    setStep('category');
  };

  const handleCategorySelect = (category: CategoryItem) => {
    router.push(`/upload/memorabilia/${selectedType?.code}/${category.code}` as Href);
  };

  const handleBack = () => {
    if (step === 'category') {
      setStep('type');
      setSelectedType(null);
      setSearchQuery('');
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {step === 'type'
            ? 'Memorabilia /'
            : `Memorabilia / ${selectedType?.name} /`}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={step === 'type' ? 'Search types...' : 'Search categories...'}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          step === 'type' ? (
            <View style={styles.typeList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={TYPE_CARD_HEIGHT} borderRadius={16} />
              ))}
            </View>
          ) : (
            <View>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.skeletonRow}>
                  <Skeleton width={180} height={18} borderRadius={6} />
                  <Skeleton width={20} height={20} borderRadius={4} />
                </View>
              ))}
            </View>
          )
        ) : error && types.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={32} color={colors.mutedForeground + '4D'} />
            <Text style={styles.emptyStateText}>{error}</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
              <Text style={styles.emptyStateAction}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : step === 'type' ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.typeList}>
            {filteredTypes.map((type, index) => (
              <TypeCard key={type.id} type={type} index={index} onSelect={() => handleTypeSelect(type)} />
            ))}
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
            {filteredCategories.map((category, index) => (
              <SubcategoryRow key={category.id} category={category} index={index} onSelect={() => handleCategorySelect(category)} />
            ))}
          </Animated.View>
        )}

        {!loading && !error && ((step === 'type' && filteredTypes.length === 0) ||
          (step === 'category' && filteredCategories.length === 0)) && (
          <View style={styles.emptyState}>
            <Search size={32} color={colors.mutedForeground + '4D'} />
            <Text style={styles.emptyStateText}>No results for &quot;{searchQuery}&quot;</Text>
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear search query">
              <Text style={styles.emptyStateAction}>Clear query</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeList: {
    gap: 12,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 16,
    marginBottom: 12,
  },
  emptyStateAction: {
    fontSize: 14,
    color: colors.primary,
  },
  bottomSpacer: {
    height: 32,
  },
});
