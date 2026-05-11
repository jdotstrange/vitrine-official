import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, ChevronRight, Star } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OptimizedImage } from './optimized-image';
import { SearchBar } from './search-bar';
import { colors } from '@/lib/colors';
import { searchCards, CardSearchResult } from '@/lib/api/trading-cards';
import { logger } from '@/lib/logger';

const log = logger.create('TradingCardSearch');

interface TradingCardSearchProps {
  onCardSelect: (card: CardSearchResult) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { code: 'Baseball', label: 'Baseball', emoji: '⚾' },
  { code: 'Basketball', label: 'Basketball', emoji: '🏀' },
  { code: 'Football', label: 'Football', emoji: '🏈' },
  { code: 'Pokemon', label: 'Pokémon', emoji: '⚡' },
  { code: 'Hockey', label: 'Hockey', emoji: '🏒' },
  { code: 'Soccer', label: 'Soccer', emoji: '⚽' },
];

export function TradingCardSearch({ onCardSelect, onClose }: TradingCardSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const performSearch = useCallback(async (searchQuery: string, category?: string | null) => {
    if (!searchQuery.trim() && !category) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { cards } = await searchCards({
        query: searchQuery.trim() || undefined,
        category: category || undefined,
        limit: 30,
      });
      setResults(cards);
    } catch (err) {
      log.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    
    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      performSearch(text, selectedCategory);
    }, 400);
  };

  const handleCategorySelect = (category: string) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    performSearch(query, newCategory);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSelectedCategory(null);
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar - using shared component */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search by player, set, or card name..."
          value={query}
          onChange={handleQueryChange}
          showClear={!!query || !!selectedCategory}
          onClear={handleClearSearch}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.categoryPill,
                selectedCategory === item.code && styles.categoryPillActive,
              ]}
              onPress={() => handleCategorySelect(item.code)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} category`}
            >
              <Text style={styles.categoryEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === item.code && styles.categoryLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.centerText}>Searching cards...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => performSearch(query, selectedCategory)}
              accessibilityRole="button"
              accessibilityLabel="Retry search"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : results.length > 0 ? (
          <>
            {results.map((card, index) => (
              <CardListItem
                key={card.cardHedgeId}
                card={card}
                index={index}
                onSelect={() => onCardSelect(card)}
              />
            ))}
            <View style={{ height: 32 }} />
          </>
        ) : hasSearched ? (
          <View style={styles.centerContainer}>
            <Search size={32} color={colors.mutedForeground + '4D'} />
            <Text style={styles.emptyTitle}>No cards found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Search size={32} color={colors.mutedForeground + '4D'} />
            <Text style={styles.emptyTitle}>Search for your card</Text>
            <Text style={styles.emptySubtitle}>
              Enter a player name, set, or card description
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CardListItem({
  card,
  index,
  onSelect,
}: {
  card: CardSearchResult;
  index: number;
  onSelect: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <TouchableOpacity
        style={styles.listItem}
        onPress={onSelect}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select ${card.cardName}`}
      >
        <View style={styles.listItemOverlay} />
        <View style={styles.listItemContent}>
          {/* Card Image */}
          <View style={styles.listItemIcon}>
            {card.imageUrl ? (
              <OptimizedImage
                source={{ uri: card.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
                accessibilityLabel={`${card.cardName} image`}
              />
            ) : (
              <Text style={styles.cardImagePlaceholder}>🃏</Text>
            )}
            {card.isRookie && (
              <View style={styles.rookieBadge}>
                <Star size={8} color={colors.smartAmber} fill={colors.smartAmber} />
              </View>
            )}
          </View>

          {/* Card Info */}
          <View style={styles.listItemText}>
            <Text style={styles.listItemTitle} numberOfLines={2}>
              {card.cardName}
            </Text>
            {card.playerName && (
              <Text style={styles.listItemPlayer} numberOfLines={1}>
                {card.playerName}
              </Text>
            )}
            <View style={styles.listItemMeta}>
              {card.year && <Text style={styles.listItemYear}>{card.year}</Text>}
              {card.setName && (
                <Text style={styles.listItemSet} numberOfLines={1}>
                  {card.setName}
                </Text>
              )}
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {card.cardHedgeCategory || card.categoryCode}
              </Text>
            </View>
          </View>

          <ChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  categoryLabelActive: {
    color: colors.accent,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  listItem: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    position: 'relative',
    zIndex: 1,
  },
  listItemIcon: {
    width: 56,
    height: 78,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    fontSize: 24,
  },
  rookieBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    flex: 1,
    gap: 2,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    lineHeight: 18,
  },
  listItemPlayer: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  listItemYear: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  listItemSet: {
    fontSize: 12,
    color: colors.mutedForeground,
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.muted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  centerText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
