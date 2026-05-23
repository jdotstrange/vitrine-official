import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, Camera, Check, Layers, ChevronRight, Plus, Sparkles, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/lib/colors';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptimizedImage } from './optimized-image';
import { SearchBar } from './search-bar';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { PricingModeSelector } from './pricing-mode-selector';
import { CardSearchResult, GradeInfo, PricingMode, formatPrice, calculateEffectivePrice } from '@/lib/api/trading-cards';

interface ImageItem {
  id: string;
  uri: string;
}

interface Showcase {
  id: string;
  name: string;
  itemCount: number;
}

const mockShowcases: Showcase[] = [
  { id: '1', name: 'Grails', itemCount: 12 },
  { id: '2', name: 'Sports Cards', itemCount: 28 },
  { id: '3', name: 'Investment Cards', itemCount: 45 },
  { id: '4', name: 'Vintage', itemCount: 8 },
];

export interface TradingCardDetailsFormData {
  card: CardSearchResult;
  grade: GradeInfo;
  photos: string[];
  pricingMode: PricingMode;
  marginPercentage: number | null;
  manualPrice: number | null;
  effectivePrice: number;
  status: ListingStatus;
  showcaseId: string | null;
  tags: string[];
  certificateNumber?: string;
}

interface TradingCardDetailsFormProps {
  card: CardSearchResult;
  grade: GradeInfo;
  onSubmit: (data: TradingCardDetailsFormData) => void;
  onBack: () => void;
}

export function TradingCardDetailsForm({
  card,
  grade,
  onSubmit,
  onBack,
}: TradingCardDetailsFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const tagsInputRef = useRef<TextInput>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<ListingStatus>('NFST');
  const [selectedShowcase, setSelectedShowcase] = useState<Showcase | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showcaseSearch, setShowcaseSearch] = useState('');
  const [newShowcaseName, setNewShowcaseName] = useState('');
  const [showCreateShowcase, setShowCreateShowcase] = useState(false);

  // Pricing state
  const apiPrice = grade.apiPriceAvailable && grade.apiPrice ? Number(grade.apiPrice) : null;
  const [pricingMode, setPricingMode] = useState<PricingMode>(apiPrice ? 'dynamic' : 'manual');
  const [marginPercentage, setMarginPercentage] = useState(0); // Will be set by user (positive = markup, negative = discount)
  const [manualPrice, setManualPrice] = useState<string>(apiPrice?.toString() || '');

  // Calculate effective price
  const effectivePrice = useMemo(() => {
    const manual = parseFloat(manualPrice.replace(/[^0-9.]/g, '')) || 0;
    return calculateEffectivePrice(pricingMode, apiPrice, marginPercentage, manual);
  }, [pricingMode, apiPrice, marginPercentage, manualPrice]);

  // Form validation - require at least 2 photos (front and back)
  const isFormValid = images.length >= 2 && effectivePrice > 0;

  const statusOptions: ListingStatus[] = ['NFST', 'FOR_SALE', 'FOR_TRADE', 'SELL_TRADE'];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to upload images.');
      return false;
    }
    return true;
  };

  const handleImageSelect = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 7 - images.length,
    });

    if (!result.canceled && result.assets) {
      const newImages: ImageItem[] = result.assets.map((asset) => ({
        id: Math.random().toString(36).substring(7),
        uri: asset.uri,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [images.length]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Filter showcases based on search
  const filteredShowcases = useMemo(() => {
    return mockShowcases.filter((s) => s.name.toLowerCase().includes(showcaseSearch.toLowerCase()));
  }, [showcaseSearch]);

  // Handle tag input
  const handleTagSubmit = () => {
    const trimmedTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleTagInputChange = (text: string) => {
    const filtered = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    setTagInput(filtered);
    
    if (text.includes(',') || text.includes(' ')) {
      const trimmedTag = filtered.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCreateShowcase = () => {
    if (newShowcaseName.trim()) {
      const newShowcase: Showcase = {
        id: Math.random().toString(36).substring(7),
        name: newShowcaseName.trim(),
        itemCount: 0,
      };
      setSelectedShowcase(newShowcase);
      setShowShowcaseModal(false);
      setNewShowcaseName('');
      setShowCreateShowcase(false);
      setShowcaseSearch('');
    }
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    const formData: TradingCardDetailsFormData = {
      card,
      grade,
      photos: images.map((img) => img.uri),
      pricingMode,
      marginPercentage: pricingMode === 'dynamic_margin' ? marginPercentage : null,
      manualPrice: pricingMode === 'manual' ? parseFloat(manualPrice.replace(/[^0-9.]/g, '')) : null,
      effectivePrice,
      status,
      showcaseId: selectedShowcase?.id || null,
      tags,
      certificateNumber: certificateNumber.trim() || undefined,
    };

    onSubmit(formData);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      automaticOffset
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Card Info Display */}
          <View style={styles.cardInfoContainer}>
            <View style={styles.cardInfoOverlay} />
            <View style={styles.cardInfoContent}>
              <View style={styles.cardInfoImage}>
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
              </View>
              <View style={styles.cardInfoText}>
                <Text style={styles.cardInfoTitle} numberOfLines={2}>{card.cardName}</Text>
                {card.playerName && (
                  <Text style={styles.cardInfoPlayer}>{card.playerName}</Text>
                )}
                <Text style={styles.cardInfoMeta}>
                  {grade.grade} • {grade.gradingCompany || 'PSA'}
                </Text>
              </View>
            </View>
          </View>

          {/* Photos Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionDescription}>
              Upload at least 2 photos (front and back required)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {images.map((image) => (
                <View key={image.id} style={styles.imageWrapper}>
                  <OptimizedImage source={{ uri: image.uri }} style={styles.image} contentFit="cover" accessibilityLabel="Card photo" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(image.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <X size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 7 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleImageSelect}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Add photo"
                >
                  <View style={styles.addImageButtonOverlay} />
                  <Camera size={24} color={colors.accent} />
                  <Text style={styles.addImageButtonText}>
                    {images.length === 0 ? 'Add Front' : images.length === 1 ? 'Add Back' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            {images.length < 2 && (
              <Text style={styles.photoWarning}>
                {2 - images.length} more photo{images.length === 1 ? '' : 's'} required
              </Text>
            )}
          </View>

          {/* Value Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Value</Text>
            <PricingModeSelector
              mode={pricingMode}
              onModeChange={setPricingMode}
              apiPrice={apiPrice}
              marginPercentage={marginPercentage}
              onMarginChange={setMarginPercentage}
              manualPrice={manualPrice}
              onManualPriceChange={setManualPrice}
              effectivePrice={effectivePrice}
            />
          </View>

          {/* Certificate Number (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificate Number</Text>
            <Text style={styles.sectionDescription}>Optional - helps verify authenticity</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputOverlay} />
              <TextInput
                style={styles.input}
                placeholder="Enter PSA/BGS cert number"
                placeholderTextColor={colors.mutedForeground}
                value={certificateNumber}
                onChangeText={setCertificateNumber}
                keyboardType="number-pad"
                accessibilityLabel="Certificate number"
              />
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusContainer}>
              {statusOptions.map((option) => {
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
                    onPress={() => setStatus(option)}
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

          {/* Assign to Showcase */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign to Showcase</Text>
            <TouchableOpacity
              style={styles.showcaseButton}
              onPress={() => setShowShowcaseModal(true)}
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

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <Text style={styles.sectionDescription}>
              Add tags to help organize and find this card
            </Text>
            <View style={styles.tagsContainer}>
            <View style={styles.tagsOverlay} />
              {tags.length > 0 && (
                <View style={styles.tagsList}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => removeTag(index)}
                        style={styles.tagRemoveButton}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove tag ${tag}`}
                      >
                        <X size={14} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.tagInputContainer}>
                <TextInput
                  ref={tagsInputRef}
                  style={styles.tagInput}
                  placeholder={tags.length === 0 ? 'Type a tag...' : 'Add another tag...'}
                  placeholderTextColor={colors.mutedForeground}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onSubmitEditing={handleTagSubmit}
                  returnKeyType="done"
                  accessibilityLabel="Tag input"
                  onFocus={() => {
                    scrollTimerRef.current = setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
                {tagInput.length > 0 && (
                  <TouchableOpacity
                    onPress={handleTagSubmit}
                    style={styles.tagAddButton}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Add tag"
                  >
                    <Plus size={16} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add to collection"
          >
            <Text style={styles.submitButtonText}>Add to Collection</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Showcase Selection Modal */}
        <Modal
          visible={showShowcaseModal}
          animationType="slide"
          transparent={true}
          accessibilityViewIsModal={true}
          onRequestClose={() => {
            setShowShowcaseModal(false);
            setShowcaseSearch('');
            setShowCreateShowcase(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalOverlay} />
            <View style={[styles.modalContent, { paddingTop: insets.top }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowShowcaseModal(false);
                    setShowcaseSearch('');
                    setShowCreateShowcase(false);
                  }}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <X size={20} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Showcase</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Search */}
              <View style={styles.modalSearchContainer}>
                <SearchBar
                  value={showcaseSearch}
                  onChange={setShowcaseSearch}
                  placeholder="Search showcases..."
                  showClear
                />
              </View>

              {/* Showcase List */}
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {/* Create new option */}
                {!showCreateShowcase ? (
                  <TouchableOpacity
                    style={styles.modalListItem}
                    onPress={() => setShowCreateShowcase(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Create new showcase"
                  >
                    <View style={styles.modalListItemIcon}>
                      <Plus size={20} color={colors.accent} />
                    </View>
                    <Text style={styles.modalListItemTextPrimary}>Create New Showcase</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalListItem}>
                    <View style={styles.createShowcaseInputContainer}>
                      <View style={styles.inputContainer}>
                        <View style={styles.inputOverlay} />
                        <TextInput
                          style={styles.input}
                          placeholder="Showcase name..."
                          placeholderTextColor={colors.mutedForeground}
                          value={newShowcaseName}
                          onChangeText={setNewShowcaseName}
                          autoFocus
                          accessibilityLabel="Showcase name"
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.createButton, !newShowcaseName.trim() && styles.createButtonDisabled]}
                        onPress={handleCreateShowcase}
                        disabled={!newShowcaseName.trim()}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Create showcase"
                      >
                        <Text style={styles.createButtonText}>Create</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Existing showcases */}
                {filteredShowcases.map((showcase) => (
                  <TouchableOpacity
                    key={showcase.id}
                    style={styles.modalListItem}
                    onPress={() => {
                      setSelectedShowcase(showcase);
                      setShowShowcaseModal(false);
                      setShowcaseSearch('');
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${showcase.name} showcase`}
                  >
                    <View style={styles.modalListItemIcon}>
                      <Sparkles size={20} color={colors.mutedForeground} />
                    </View>
                    <View style={styles.modalListItemContent}>
                      <Text style={styles.modalListItemText}>{showcase.name}</Text>
                      <Text style={styles.modalListItemSubtext}>{showcase.itemCount} items</Text>
                    </View>
                    {selectedShowcase?.id === showcase.id && (
                      <Check size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                ))}

                {/* None option */}
                <TouchableOpacity
                  style={styles.modalListItem}
                  onPress={() => {
                    setSelectedShowcase(null);
                    setShowShowcaseModal(false);
                    setShowcaseSearch('');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="No showcase"
                >
                  <Text style={[styles.modalListItemText, { color: colors.mutedForeground }]}>No showcase</Text>
                  {selectedShowcase === null && <Check size={20} color={colors.accent} />}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardInfoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cardInfoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  cardInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  cardInfoImage: {
    width: 56,
    height: 78,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    fontSize: 24,
  },
  cardInfoText: {
    flex: 1,
    gap: 4,
  },
  cardInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    lineHeight: 20,
  },
  cardInfoPlayer: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent,
  },
  cardInfoMeta: {
    fontSize: 13,
    color: colors.mutedForeground,
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
  sectionDescription: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 12,
    marginTop: -8,
  },
  imagesContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  addImageButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  addImageButtonText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  photoWarning: {
    fontSize: 12,
    color: colors.destructive,
    marginTop: 8,
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
  tagsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    padding: 12,
  },
  tagsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accent + '33',
    borderWidth: 1,
    borderColor: colors.accent + '4D',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent,
  },
  tagRemoveButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    padding: 0,
    minHeight: 24,
  },
  tagAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalList: {
    flex: 1,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  modalListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListItemContent: {
    flex: 1,
  },
  modalListItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  modalListItemTextPrimary: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
  },
  modalListItemSubtext: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  createShowcaseInputContainer: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  headerSpacer: {
    width: 40,
  },
});
