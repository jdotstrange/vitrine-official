import { View, StyleSheet, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import { useAuth } from '@/lib/contexts/auth-context';
import { uploadImage } from '@/lib/image-utils';
import { TradingCardSearch } from '@/components/trading-card-search';
import { TradingCardGradeSelect } from '@/components/trading-card-grade-select';
import { TradingCardDetailsForm, TradingCardDetailsFormData } from '@/components/trading-card-details-form';
import { TradingCardSuccess } from '@/components/trading-card-success';
import { CardSearchResult, GradeInfo, createTradingCard } from '@/lib/api/trading-cards';

type Step = 'search' | 'grade' | 'details' | 'success';

const uploadLog = logger.create('TradingCardUpload');

async function uploadPhotos(userId: string, localUris: string[]): Promise<string[]> {
  const results = await Promise.all(
    localUris.map(async (uri, idx) => {
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const basePath = `${userId}/${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { url } = await uploadImage('collectible-images', basePath, uri);
      return url;
    }),
  );
  return results;
}

export default function TradingCardsUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('search');
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeInfo | null>(null);
  const [submittedData, setSubmittedData] = useState<TradingCardDetailsFormData | null>(null);
  const [collectibleId, setCollectibleId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCardSelect = useCallback((card: CardSearchResult) => {
    setSelectedCard(card);
    setStep('grade');
  }, []);

  const handleGradeSelect = useCallback((card: CardSearchResult, grade: GradeInfo) => {
    setSelectedCard(card);
    setSelectedGrade(grade);
    setStep('details');
  }, []);

  const handleDetailsSubmit = useCallback(async (data: TradingCardDetailsFormData) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'You need to be signed in to upload a trading card.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload local photos to Supabase Storage and collect public URLs.
      // The RN form produces file:// URIs from ImagePicker; the edge function needs
      // real HTTPS URLs to persist in collectibles.photos.
      uploadLog.info('Uploading', data.photos.length, 'photos to storage');
      const photoUrls = await uploadPhotos(user.id, data.photos);
      uploadLog.info('Photos uploaded', photoUrls.length);

      // Step 2: Create the trading card via edge function. Pass full catalog
      // context so the server can upsert card_catalog with complete metadata.
      const result = await createTradingCard({
        // Catalog fields (from Card Hedge search result)
        cardHedgeId: data.card.cardHedgeId,
        cardName: data.card.cardName,
        playerName: data.card.playerName,
        year: data.card.year,
        setName: data.card.setName,
        cardNumber: data.card.cardNumber,
        variant: data.card.variant,
        cardHedgeCategory: data.card.cardHedgeCategory,
        categoryGroup: data.card.categoryGroup,
        categoryCode: data.card.categoryCode,
        isRookie: data.card.isRookie,
        imageUrl: data.card.imageUrl,
        // Grade-specific fields
        grade: data.grade.grade,
        gradingCompany: data.grade.gradingCompany || 'PSA',
        apiPrice: data.grade.apiPrice ?? undefined,
        apiPriceAvailable: data.grade.apiPriceAvailable,
        // Listing fields
        photos: photoUrls,
        pricingMode: data.pricingMode,
        marginPercentage: data.marginPercentage ?? undefined,
        manualPrice: data.manualPrice ?? undefined,
        status: data.status,
        showcaseId: data.showcaseId ?? undefined,
        tags: data.tags,
        certificateNumber: data.certificateNumber,
      });

      uploadLog.info('Trading card created', result.collectibleId);
      setCollectibleId(result.collectibleId);
      setSubmittedData(data);
      setStep('success');
    } catch (error) {
      uploadLog.error('Failed to create trading card:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      Alert.alert('Upload failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id]);

  const handleViewCollection = useCallback(() => {
    if (collectibleId) {
      router.replace(`/collectible/${collectibleId}` as Href);
    } else {
      router.replace('/(tabs)');
    }
  }, [router, collectibleId]);

  const handleAddAnother = useCallback(() => {
    // Reset state and go back to search
    setSelectedCard(null);
    setSelectedGrade(null);
    setSubmittedData(null);
    setCollectibleId(undefined);
    setStep('search');
  }, []);

  const handleBackFromGrade = useCallback(() => {
    setSelectedCard(null);
    setStep('search');
  }, []);

  const handleBackFromDetails = useCallback(() => {
    setSelectedGrade(null);
    setStep('grade');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: step === 'search' ? insets.top : 0 }]}>
      {step === 'search' && (
        <View style={styles.fullScreen}>
          {/* Header for search step */}
          <View style={styles.searchHeader}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerTitle}>
                <View style={styles.headerTitleText} />
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <TradingCardSearch onCardSelect={handleCardSelect} />
        </View>
      )}

      {step === 'grade' && selectedCard && (
        <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
          <TradingCardGradeSelect
            card={selectedCard}
            onGradeSelect={handleGradeSelect}
            onBack={handleBackFromGrade}
          />
        </View>
      )}

      {step === 'details' && selectedCard && selectedGrade && (
        <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
          <TradingCardDetailsForm
            card={selectedCard}
            grade={selectedGrade}
            onSubmit={handleDetailsSubmit}
            onBack={handleBackFromDetails}
          />
        </View>
      )}

      {step === 'success' && submittedData && (
        <TradingCardSuccess
          data={submittedData}
          collectibleId={collectibleId}
          onViewCollection={handleViewCollection}
          onAddAnother={handleAddAnother}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreen: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
});
