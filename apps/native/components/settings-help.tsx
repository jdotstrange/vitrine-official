import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Search, X } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardSafeScroll } from '@/components/vault';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQs: FAQItem[] = [
  {
    question: 'How do I add a collectible to my collection?',
    answer:
      'Tap the + button in the bottom navigation bar, then select "Add Collectible". You can upload photos, add details like name, category, and estimated value, then set a status and visibility.',
  },
  {
    question: 'What do the different statuses mean?',
    answer:
      'SELL + TRADE means you\'re open to both selling and trading. FOR SALE means you\'re only looking to sell. FOR TRADE means you\'re only looking to trade. NFST (Not For Sale or Trade) means the item is in your personal collection and not available.',
  },
  {
    question: 'How do I create a showcase?',
    answer:
      'Go to the + button and select "Create Showcase". You\'ll name your showcase, hand-pick collectibles from your collection, choose a visibility setting, and you\'re done.',
  },
  {
    question: 'Will there be more showcase types?',
    answer:
      'Smart Showcases are coming with Vitrine Pro. They\'ll automatically include items that match rules you define (like "all sneakers" or "items over $500") and update as your collection grows.',
  },
  {
    question: 'How do I track an item?',
    answer:
      'When viewing any collectible, tap the tracking icon to add it to your tracked items. You can set price alerts to be notified when the item\'s status or value changes.',
  },
  {
    question: 'Can I make my collection private?',
    answer:
      'Yes! Go to Settings > Privacy Settings and change your Profile Visibility. You can also set individual items to private when uploading or editing them.',
  },
  {
    question: 'How do I export my collection data?',
    answer:
      'Go to Settings > Export Collection. You can download your entire collection as a CSV or JSON file, including all metadata, values, and showcase configurations.',
  },
];

export function SettingsHelp() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQs = FAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Help Center</Text>
      </View>

      <View style={s.searchSection}>
        <View style={[s.searchBar, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search help topics..."
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Search FAQ"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardSafeScroll style={s.content} contentContainerStyle={s.contentContainer}>
        {filteredFAQs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>No results found for "{searchQuery}"</Text>
          </View>
        ) : (
          <View style={s.faqList}>
            {filteredFAQs.map((faq, index) => {
              const originalIndex = FAQs.indexOf(faq);
              const isExpanded = expandedIndex === originalIndex;
              return (
                <View key={index} style={[s.faqCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                  <TouchableOpacity
                    onPress={() => setExpandedIndex(isExpanded ? null : originalIndex)}
                    style={s.faqHeader}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.faqQuestion, { color: colors.textPrimary }]} numberOfLines={isExpanded ? undefined : 2}>
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={18} color={colors.textTertiary} />
                    ) : (
                      <ChevronDown size={18} color={colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={[s.faqAnswer, { borderTopColor: colors.frostDivider }]}>
                      <Text style={[s.faqAnswerText, { color: colors.textSecondary }]}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </KeyboardSafeScroll>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  searchSection: {
    paddingHorizontal: SPACING.gutter,
    paddingVertical: SPACING.zoneIntra,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.gutter,
    paddingBottom: 40,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.rowPadX,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.rowPadX,
    paddingBottom: SPACING.rowPadX,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  faqAnswerText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
});
