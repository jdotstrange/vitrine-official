import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRef } from 'react';
import { ArrowLeft, Layers, ChevronRight, Globe, Lock } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ShowcaseOption } from '../ui/showcase-picker-modal';
import { PhotoGrid } from './photo-grid';
import { TagsInput } from './tags-input';

export interface ImageItem {
  id: string;
  uri: string;
}

interface MemorabiliaCoreFormProps {
  type: string;
  category: string;
  images: ImageItem[];
  title: string;
  value: string;
  status: ListingStatus;
  isPublic: boolean;
  selectedShowcase: ShowcaseOption | null;
  tags: string[];
  tagInput: string;
  isFormValid: boolean;
  onImagesReorder: (data: ImageItem[]) => void;
  onImageSelect: () => void;
  onImageRemove: (id: string) => void;
  onTitleChange: (text: string) => void;
  onValueChange: (text: string) => void;
  onStatusChange: (status: ListingStatus) => void;
  onPublicToggle: (isPublic: boolean) => void;
  onShowcasePress: () => void;
  onTagInputChange: (text: string) => void;
  onTagSubmit: () => void;
  onTagRemove: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function formatLabel(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const STATUS_OPTIONS: ListingStatus[] = ['NFST', 'FOR_SALE', 'FOR_TRADE', 'SELL_TRADE'];

export function MemorabiliaCoreForm({
  type,
  category,
  images,
  title,
  value,
  status,
  isPublic,
  selectedShowcase,
  tags,
  tagInput,
  isFormValid,
  onImagesReorder,
  onImageSelect,
  onImageRemove,
  onTitleChange,
  onValueChange,
  onStatusChange,
  onPublicToggle,
  onShowcasePress,
  onTagInputChange,
  onTagSubmit,
  onTagRemove,
  onSubmit,
  onBack,
}: MemorabiliaCoreFormProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Memorabilia / {formatLabel(type || '')} / {formatLabel(category || '')}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.sectionGroupHeader}>THE ESSENTIALS</Text>

          <PhotoGrid
            images={images}
            onReorder={onImagesReorder}
            onAdd={onImageSelect}
            onRemove={onImageRemove}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputOverlay} />
              <TextInput
                style={styles.input}
                placeholder="Enter collectible title"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={onTitleChange}
                accessibilityLabel="Collectible title"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Value{status === 'NFST' ? <Text style={styles.optionalHint}> (optional)</Text> : ''}
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputOverlay} />
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor={colors.mutedForeground}
                value={value}
                onChangeText={onValueChange}
                keyboardType="decimal-pad"
                accessibilityLabel={`Value${status === 'NFST' ? ', optional' : ''}`}
              />
            </View>
          </View>

          <Text style={styles.sectionGroupHeader}>LISTING OPTIONS</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusContainer}>
              {STATUS_OPTIONS.map((option) => {
                const config = getStatusConfig(option);
                const isSelected = status === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.statusOption,
                      isSelected && {
                        backgroundColor: config.bgColor,
                        borderColor: config.borderColor,
                      },
                    ]}
                    onPress={() => onStatusChange(option)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${config.label}`}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        isSelected && { color: config.textColor },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <View style={styles.visibilityContainer}>
              <TouchableOpacity
                style={[styles.visibilityOption, isPublic && styles.visibilityOptionActive]}
                onPress={() => onPublicToggle(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Set listing to public"
              >
                <Globe size={16} color={isPublic ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.visibilityOptionText, isPublic && styles.visibilityOptionTextActive]}>
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visibilityOption, !isPublic && styles.visibilityOptionActive]}
                onPress={() => onPublicToggle(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Set listing to private"
              >
                <Lock size={16} color={!isPublic ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.visibilityOptionText, !isPublic && styles.visibilityOptionTextActive]}>
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionGroupHeader}>ORGANIZATION</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign to Showcase</Text>
            <TouchableOpacity
              style={styles.showcaseButton}
              onPress={onShowcasePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Select showcase"
            >
              <View style={styles.showcaseButtonOverlay} />
              <View style={styles.showcaseButtonContent}>
                <Layers size={20} color={selectedShowcase ? colors.foreground : colors.mutedForeground} />
                <Text style={[styles.showcaseButtonText, !selectedShowcase && styles.showcaseButtonTextPlaceholder]}>
                  {selectedShowcase?.name || 'None selected'}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TagsInput
            tags={tags}
            tagInput={tagInput}
            onTagInputChange={onTagInputChange}
            onTagSubmit={onTagSubmit}
            onTagRemove={onTagRemove}
            scrollViewRef={scrollViewRef}
          />
        </ScrollView>

        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={!isFormValid}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add to collection"
          >
            <Text style={styles.submitButtonText}>Add to Collection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionGroupHeader: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.mutedForeground,
    marginBottom: 16,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  optionalHint: {
    fontWeight: '400',
    color: colors.mutedForeground,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: colors.foreground,
    position: 'relative',
    zIndex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  visibilityOptionActive: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '10',
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  visibilityOptionTextActive: {
    color: colors.primary,
  },
  showcaseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  showcaseButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  showcaseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  showcaseButtonText: {
    fontSize: 16,
    color: colors.foreground,
  },
  showcaseButtonTextPlaceholder: {
    color: colors.mutedForeground,
  },
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
