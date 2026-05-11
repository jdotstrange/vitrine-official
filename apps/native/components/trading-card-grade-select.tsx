import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, TrendingUp, TrendingDown, AlertCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OptimizedImage } from './optimized-image';
import { colors } from '@/lib/colors';
import { getCardDetails, CardSearchResult, GradeInfo, formatPrice } from '@/lib/api/trading-cards';
import { logger } from '@/lib/logger';

const log = logger.create('TradingCardGrade');

interface TradingCardGradeSelectProps {
  card: CardSearchResult;
  onGradeSelect: (card: CardSearchResult, grade: GradeInfo) => void;
  onBack: () => void;
}

// Common grades in order of quality
const GRADE_ORDER = [
  'PSA 10', 'BGS 10', 'CGC 10', 'SGC 10',
  'PSA 9.5', 'BGS 9.5', 'CGC 9.5', 'SGC 9.5',
  'PSA 9', 'BGS 9', 'CGC 9', 'SGC 9',
  'PSA 8.5', 'BGS 8.5', 'CGC 8.5', 'SGC 8.5',
  'PSA 8', 'BGS 8', 'CGC 8', 'SGC 8',
  'PSA 7', 'BGS 7', 'CGC 7', 'SGC 7',
  'PSA 6', 'PSA 5', 'PSA 4', 'PSA 3', 'PSA 2', 'PSA 1',
  'Raw', 'Ungraded',
];

function sortGrades(grades: GradeInfo[]): GradeInfo[] {
  return [...grades].sort((a, b) => {
    const aIndex = GRADE_ORDER.findIndex(g => 
      a.grade.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(a.grade.toLowerCase())
    );
    const bIndex = GRADE_ORDER.findIndex(g => 
      b.grade.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(b.grade.toLowerCase())
    );
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export function TradingCardGradeSelect({ card, onGradeSelect, onBack }: TradingCardGradeSelectProps) {
  const [grades, setGrades] = useState<GradeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  useEffect(() => {
    loadGrades();
  }, [card.cardHedgeId]);

  const loadGrades = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const details = await getCardDetails(card.cardHedgeId);
      const sortedGrades = sortGrades(details.grades || []);
      setGrades(sortedGrades);
    } catch (err) {
      log.error('Failed to load grades:', err);
      setError(err instanceof Error ? err.message : 'Failed to load grades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSelect = (grade: GradeInfo) => {
    setSelectedGrade(grade.grade);
    onGradeSelect(card, grade);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Grade</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Card Preview */}
      <View style={styles.cardPreviewContainer}>
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewOverlay} />
          <View style={styles.cardPreviewContent}>
            <View style={styles.cardImageContainer}>
              {card.imageUrl ? (
                <OptimizedImage
                  source={{ uri: card.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                  accessibilityLabel={`${card.cardName} preview`}
                />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={styles.cardImagePlaceholderText}>🃏</Text>
                </View>
              )}
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardName} numberOfLines={2}>
                {card.cardName}
              </Text>
              {card.playerName && (
                <Text style={styles.playerName}>{card.playerName}</Text>
              )}
              {card.setName && (
                <Text style={styles.setName}>{card.year} {card.setName}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Grades</Text>
      </View>

      {/* Grades List */}
      <ScrollView
        style={styles.gradesList}
        contentContainerStyle={styles.gradesListContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.centerText}>Loading grades...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={32} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadGrades} accessibilityRole="button" accessibilityLabel="Retry loading grades">
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : grades.length > 0 ? (
          <>
            {grades.map((grade, index) => (
              <GradeListItem
                key={grade.grade}
                grade={grade}
                index={index}
                isSelected={selectedGrade === grade.grade}
                onSelect={() => handleGradeSelect(grade)}
              />
            ))}
            
            {/* Raw/Ungraded option */}
            <Animated.View entering={FadeIn.delay(grades.length * 50)}>
              <TouchableOpacity
                style={[styles.listItem, styles.listItemDashed]}
                onPress={() => handleGradeSelect({
                  grade: 'Raw',
                  gradingCompany: 'Ungraded',
                  apiPrice: null,
                  apiPriceAvailable: false,
                })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Select ungraded"
              >
                <View style={styles.listItemOverlay} />
                <View style={styles.listItemContent}>
                  <View style={styles.gradeIcon}>
                    <Text style={styles.gradeText}>Raw</Text>
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemTitle}>Ungraded</Text>
                    <Text style={styles.listItemSubtitle}>Set your own price</Text>
                  </View>
                  <ChevronRight size={20} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.bottomSpacer} />
          </>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No grades available</Text>
            <TouchableOpacity
              style={styles.rawOnlyButton}
              onPress={() => handleGradeSelect({
                grade: 'Raw',
                gradingCompany: 'Ungraded',
                apiPrice: null,
                apiPriceAvailable: false,
              })}
              accessibilityRole="button"
              accessibilityLabel="Continue with raw ungraded"
            >
              <Text style={styles.rawOnlyButtonText}>Continue with Raw/Ungraded</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function GradeListItem({
  grade,
  index,
  isSelected,
  onSelect,
}: {
  grade: GradeInfo;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasPricing = grade.apiPriceAvailable && grade.apiPrice !== null;

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={onSelect}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select grade ${grade.grade}`}
      >
        <View style={[styles.listItemOverlay, isSelected && styles.listItemOverlaySelected]} />
        <View style={styles.listItemContent}>
          {/* Grade Badge */}
          <View style={[styles.gradeIcon, isSelected && styles.gradeIconSelected]}>
            <Text style={[styles.gradeText, isSelected && styles.gradeTextSelected]}>
              {grade.grade}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.listItemText}>
            <Text style={styles.listItemTitle}>
              {grade.gradingCompany || 'PSA'}
            </Text>
            {hasPricing ? (
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                  {formatPrice(grade.apiPrice)}
                </Text>
                {grade.gain7day !== undefined && grade.gain7day !== null && (
                  <View style={[
                    styles.trendBadge,
                    grade.gain7day >= 0 ? styles.trendUp : styles.trendDown,
                  ]}>
                    {grade.gain7day >= 0 ? (
                      <TrendingUp size={10} color={colors.holoGreen} />
                    ) : (
                      <TrendingDown size={10} color={colors.negative} />
                    )}
                    <Text style={[
                      styles.trendText,
                      grade.gain7day >= 0 ? styles.trendTextUp : styles.trendTextDown,
                    ]}>
                      {Math.abs(grade.gain7day).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.listItemSubtitle}>No pricing data</Text>
            )}
          </View>

          {isSelected ? (
            <View style={styles.checkmark}>
              <Check size={14} color={colors.background} />
            </View>
          ) : (
            <ChevronRight size={20} color={colors.mutedForeground} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  cardPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  cardPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  cardImageContainer: {
    width: 56,
    height: 78,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 24,
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    lineHeight: 20,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent,
  },
  setName: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  gradesList: {
    flex: 1,
  },
  gradesListContent: {
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
  listItemDashed: {
    borderStyle: 'dashed',
  },
  listItemSelected: {
    borderColor: colors.accent,
  },
  listItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  listItemOverlaySelected: {
    backgroundColor: colors.accent + '1A',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    position: 'relative',
    zIndex: 1,
  },
  gradeIcon: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIconSelected: {
    backgroundColor: colors.accent,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  gradeTextSelected: {
    color: colors.background,
  },
  listItemText: {
    flex: 1,
    gap: 4,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  priceTextSelected: {
    color: colors.accent,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: colors.holoGreen + '20',
  },
  trendDown: {
    backgroundColor: colors.negative + '20',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trendTextUp: {
    color: colors.holoGreen,
  },
  trendTextDown: {
    color: colors.negative,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
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
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  rawOnlyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  rawOnlyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  headerSpacer: {
    width: 40,
  },
  bottomSpacer: {
    height: 32,
  },
});
