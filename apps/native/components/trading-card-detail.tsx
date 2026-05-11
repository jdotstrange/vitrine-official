import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { SHARE_URLS } from '@/lib/constants';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { deleteTradingCard, type TradingCard } from '@/lib/api/trading-cards';
import { logger } from '@/lib/logger';

import { ImageSlider } from './detail/image-slider';
import { DetailTopControls } from './detail/detail-top-controls';
import { TitleCard } from './detail/title-card';
import { TradingCardFactsCard } from './detail/trading-card-facts';
import { TradingCardFactsSheet } from './detail/trading-card-facts-sheet';
import { TradingCardPricingCard } from './detail/trading-card-pricing-card';
import { EditPricingModal, type EditPricingData } from './detail/edit-pricing-modal';
import { QRCodeModal } from './shared/qr-code-modal';
import { Toast } from './ui/toast';

const log = logger.create('TradingCardDetail');

interface TradingCardDetailProps {
  tradingCard: TradingCard;
  collectorName: string;
  listedAt: Date | string | number;
  views?: number;
  tracks?: number;
  isOwner: boolean;
  onCollectorClick?: () => void;
  onRefresh?: () => void;
}

function statusFromFlags(
  availableForSale?: boolean,
  availableForTrade?: boolean,
): ListingStatus {
  if (availableForSale && availableForTrade) return 'SELL_TRADE';
  if (availableForSale) return 'FOR_SALE';
  if (availableForTrade) return 'FOR_TRADE';
  return 'NFST';
}

export function TradingCardDetail({
  tradingCard,
  collectorName,
  listedAt,
  views,
  tracks,
  isOwner,
  onCollectorClick,
  onRefresh,
}: TradingCardDetailProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [imageIndex, setImageIndex] = useState(0);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEditPricing, setShowEditPricing] = useState(false);
  const [showFactsSheet, setShowFactsSheet] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const details = tradingCard.trading_card_details;
  const catalog = details.card_catalog;

  const status = statusFromFlags(tradingCard.available_for_sale, tradingCard.available_for_trade);
  const statusConfig = getStatusConfig(status);
  const visibility = (tradingCard.visibility as 'public' | 'private') || 'public';
  const images = (tradingCard.photos || []).filter(Boolean);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleShare = async () => {
    const shareUrl = SHARE_URLS.collectible(tradingCard.id);
    const ownerPrefix = isOwner ? 'Check out my' : 'Check out this';
    const message = `${ownerPrefix} "${tradingCard.title}" on the Vitrine App\n\n${shareUrl}`;
    try {
      await Share.share({ message, url: shareUrl });
    } catch (err) {
      log.error('Share failed:', err);
    }
  };

  const handleDelete = () => {
    setShowOwnerMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTradingCard(tradingCard.id);
      setShowDeleteConfirm(false);
      router.back();
    } catch (err) {
      log.error('Delete failed:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      showToast('Failed to delete trading card');
    }
  };

  const handleEdit = () => {
    setShowOwnerMenu(false);
    // For trading cards, the single "Edit" surface is the pricing sheet. Other
    // metadata (photos/title/tags/status/visibility) could be added later, but
    // today the canonical facts come from Card Hedge and shouldn't be edited by
    // hand.
    setShowEditPricing(true);
  };

  const handlePricingSaved = () => {
    setShowEditPricing(false);
    showToast('Pricing updated');
    onRefresh?.();
  };

  const editPricingData: EditPricingData = {
    collectibleId: tradingCard.id,
    pricingMode: details.pricing_mode,
    apiPrice: catalog.api_price,
    apiPriceAvailable: catalog.api_price_available,
    marginPercentage: details.margin_percentage ?? null,
    manualPrice: details.manual_price ?? null,
  };

  const factsCount =
    (catalog.card_hedge_category ? 1 : 0) +
    (catalog.player_name ? 1 : 0) +
    (catalog.year ? 1 : 0) +
    (catalog.set_name ? 1 : 0) +
    (catalog.card_number ? 1 : 0) +
    (catalog.variant && catalog.variant.toLowerCase() !== 'base' ? 1 : 0) +
    (catalog.is_rookie ? 1 : 0) +
    (catalog.grading_company ? 1 : 0) +
    (catalog.grade ? 1 : 0) +
    (details.certificate_number ? 1 : 0) +
    (catalog.sales_7day != null ? 1 : 0) +
    (catalog.sales_30day != null ? 1 : 0) +
    (catalog.gain_7day != null ? 1 : 0) +
    (catalog.gain_30day != null ? 1 : 0) +
    (catalog.api_price_updated_at ? 1 : 0) +
    (catalog.card_hedge_id ? 1 : 0);

  return (
    <View style={styles.container}>
      <DetailTopControls
        isOwner={isOwner}
        showOwnerMenu={showOwnerMenu}
        insetTop={insets.top}
        onBack={() => router.back()}
        onEdit={handleEdit}
        onShowQR={() => setShowQR(true)}
        onShare={handleShare}
        onToggleOwnerMenu={() => setShowOwnerMenu(!showOwnerMenu)}
        onDelete={handleDelete}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageSlider
          images={images}
          imageIndex={imageIndex}
          statusTextColor={statusConfig.textColor}
          onImageIndexChange={setImageIndex}
        />

        <View style={styles.content}>
          <TitleCard
            title={tradingCard.title}
            statusConfig={statusConfig}
            visibility={visibility}
            collector={collectorName}
            isOwner={isOwner}
            listedAt={listedAt}
            views={views}
            tracks={tracks}
            onCollectorClick={onCollectorClick}
          />

          <TradingCardPricingCard
            pricingMode={details.pricing_mode}
            effectivePrice={Number(details.effective_price)}
            apiPrice={catalog.api_price}
            apiPriceAvailable={catalog.api_price_available}
            marginPercentage={details.margin_percentage}
            manualPrice={details.manual_price}
            apiPriceUpdatedAt={catalog.api_price_updated_at}
            isOwner={isOwner}
            onEditPricing={() => setShowEditPricing(true)}
          />

          <TradingCardFactsCard
            category={catalog.card_hedge_category}
            year={catalog.year}
            cardNumber={catalog.card_number}
            variant={catalog.variant}
            grade={catalog.grade}
            gradingCompany={catalog.grading_company}
            isRookie={catalog.is_rookie}
            factsCount={factsCount}
            onPress={() => setShowFactsSheet(true)}
          />
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
        accessibilityViewIsModal={true}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDeleteConfirm(false)}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        >
          <View style={styles.modalContent}>
            <View style={styles.deleteIconContainer}>
              <Trash2 size={24} color={colors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Delete Trading Card?</Text>
            <Text style={styles.modalText}>
              This will permanently remove this card from your collection. This action cannot be
              undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                style={styles.modalButtonCancel}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={styles.modalButtonDelete}
                activeOpacity={0.7}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Delete trading card"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextDelete]}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <EditPricingModal
        isOpen={showEditPricing}
        onClose={() => setShowEditPricing(false)}
        data={editPricingData}
        onSaved={handlePricingSaved}
      />

      <TradingCardFactsSheet
        visible={showFactsSheet}
        onClose={() => setShowFactsSheet(false)}
        category={catalog.card_hedge_category}
        playerName={catalog.player_name}
        year={catalog.year}
        setName={catalog.set_name}
        cardNumber={catalog.card_number}
        variant={catalog.variant}
        isRookie={catalog.is_rookie}
        grade={catalog.grade}
        gradingCompany={catalog.grading_company}
        certificateNumber={details.certificate_number}
        sales7day={catalog.sales_7day}
        sales30day={catalog.sales_30day}
        gain7day={catalog.gain_7day}
        gain30day={catalog.gain_30day}
        apiPriceUpdatedAt={catalog.api_price_updated_at}
        cardHedgeId={catalog.card_hedge_id}
      />

      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        value={SHARE_URLS.collectible(tradingCard.id)}
        title="Share This Card"
        subtitle="Scan to view this trading card on Vitrine"
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 384,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  modalButtonTextDelete: {
    color: colors.destructiveForeground,
  },
});
