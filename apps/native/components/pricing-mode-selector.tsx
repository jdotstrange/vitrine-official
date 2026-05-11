import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Percent, DollarSign, AlertCircle, Info, ArrowUp, ArrowDown } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { PricingMode, formatPrice } from '@/lib/api/trading-cards';

interface PricingModeSelectorProps {
  mode: PricingMode;
  onModeChange: (mode: PricingMode) => void;
  apiPrice: number | null;
  marginPercentage: number;
  onMarginChange: (margin: number) => void;
  manualPrice: string;
  onManualPriceChange: (price: string) => void;
  effectivePrice: number;
}

type MarginDirection = 'above' | 'below';

export function PricingModeSelector({
  mode,
  onModeChange,
  apiPrice,
  marginPercentage,
  onMarginChange,
  manualPrice,
  onManualPriceChange,
  effectivePrice,
}: PricingModeSelectorProps) {
  const isPriceAvailable = apiPrice !== null && apiPrice > 0;
  
  // Derive direction from marginPercentage sign
  const [direction, setDirection] = useState<MarginDirection>(marginPercentage >= 0 ? 'above' : 'below');
  const [percentageInput, setPercentageInput] = useState(Math.abs(marginPercentage).toString());

  // Sync input when marginPercentage changes externally
  useEffect(() => {
    setDirection(marginPercentage >= 0 ? 'above' : 'below');
    setPercentageInput(Math.abs(marginPercentage).toString());
  }, [marginPercentage]);

  const handleModeSelect = (newMode: PricingMode) => {
    if (!isPriceAvailable && newMode !== 'manual') {
      return;
    }
    onModeChange(newMode);
  };

  const handleDirectionChange = (newDirection: MarginDirection) => {
    setDirection(newDirection);
    const absValue = Math.abs(parseInt(percentageInput) || 0);
    if (absValue > 0) {
      const newMargin = newDirection === 'above' ? absValue : -absValue;
      onMarginChange(newMargin);
    }
  };

  const handlePercentageChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPercentageInput(cleaned);
    
    const value = parseInt(cleaned) || 0;
    
    // Validate based on direction
    if (value > 0) {
      if (direction === 'below') {
        // Cap discount at 99%
        const capped = Math.min(value, 99);
        const newMargin = -capped;
        onMarginChange(newMargin);
        if (value > 99) {
          setPercentageInput('99');
        }
      } else {
        // No ceiling for markup
        onMarginChange(value);
      }
    }
  };

  // Calculate the preview price for margin mode
  const marginPreviewPrice = apiPrice 
    ? apiPrice * (1 + (direction === 'above' ? 1 : -1) * (parseInt(percentageInput) || 0) / 100)
    : 0;

  const currentPercentage = parseInt(percentageInput) || 0;
  const isValidMargin = currentPercentage > 0 && (direction === 'above' || currentPercentage <= 99);

  return (
    <View style={styles.container}>
      {/* Pricing Mode Pills */}
      <View style={styles.modeContainer}>
        {/* Dynamic */}
        <TouchableOpacity
          style={[
            styles.modeOption,
            mode === 'dynamic' && styles.modeOptionActive,
            !isPriceAvailable && styles.modeOptionDisabled,
          ]}
          onPress={() => handleModeSelect('dynamic')}
          disabled={!isPriceAvailable}
          activeOpacity={0.7}
        >
          <TrendingUp size={14} color={mode === 'dynamic' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.modeOptionText, mode === 'dynamic' && styles.modeOptionTextActive]}>
            Dynamic
          </Text>
        </TouchableOpacity>

        {/* Dynamic with Margin */}
        <TouchableOpacity
          style={[
            styles.modeOption,
            mode === 'dynamic_margin' && styles.modeOptionActive,
            !isPriceAvailable && styles.modeOptionDisabled,
          ]}
          onPress={() => handleModeSelect('dynamic_margin')}
          disabled={!isPriceAvailable}
          activeOpacity={0.7}
        >
          <Percent size={14} color={mode === 'dynamic_margin' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.modeOptionText, mode === 'dynamic_margin' && styles.modeOptionTextActive]}>
            Margin
          </Text>
        </TouchableOpacity>

        {/* Manual */}
        <TouchableOpacity
          style={[
            styles.modeOption,
            mode === 'manual' && styles.modeOptionActive,
          ]}
          onPress={() => handleModeSelect('manual')}
          activeOpacity={0.7}
        >
          <DollarSign size={14} color={mode === 'manual' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.modeOptionText, mode === 'manual' && styles.modeOptionTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>

      {/* No API Price Notice */}
      {!isPriceAvailable && (
        <Animated.View entering={FadeIn} style={styles.noticeContainer}>
          <AlertCircle size={16} color={colors.smartAmber} />
          <Text style={styles.noticeText}>
            Market pricing unavailable. Set your own price.
          </Text>
        </Animated.View>
      )}

      {/* Mode-specific controls */}
      {mode === 'dynamic' && isPriceAvailable && (
        <Animated.View entering={SlideInDown.duration(200)} style={styles.modeDetails}>
          <View style={styles.priceDisplayContainer}>
            <View style={styles.priceDisplayOverlay} />
            <View style={styles.priceDisplayContent}>
              <View style={styles.priceDisplayRow}>
                <Text style={styles.priceDisplayLabel}>Market Price</Text>
                <Text style={styles.priceDisplayValue}>{formatPrice(apiPrice)}</Text>
              </View>
              <View style={styles.priceDisplayInfo}>
                <Info size={12} color={colors.mutedForeground} />
                <Text style={styles.priceDisplayInfoText}>
                  Price updates daily with market data
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {mode === 'dynamic_margin' && isPriceAvailable && (
        <Animated.View entering={SlideInDown.duration(200)} style={styles.modeDetails}>
          {/* Direction + Input Row */}
          <View style={styles.marginInputRow}>
            {/* Above Button */}
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === 'above' && styles.directionButtonActive,
              ]}
              onPress={() => handleDirectionChange('above')}
              activeOpacity={0.7}
            >
              <ArrowUp 
                size={16} 
                color={direction === 'above' ? colors.holoGreen : colors.mutedForeground} 
              />
              <Text style={[
                styles.directionButtonText,
                direction === 'above' && styles.directionButtonTextAbove,
              ]}>
                Above
              </Text>
            </TouchableOpacity>

            {/* Below Button */}
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === 'below' && styles.directionButtonActive,
              ]}
              onPress={() => handleDirectionChange('below')}
              activeOpacity={0.7}
            >
              <ArrowDown 
                size={16} 
                color={direction === 'below' ? colors.negative : colors.mutedForeground} 
              />
              <Text style={[
                styles.directionButtonText,
                direction === 'below' && styles.directionButtonTextBelow,
              ]}>
                Below
              </Text>
            </TouchableOpacity>

            {/* Percentage Input */}
            <View style={styles.percentageInputContainer}>
              <View style={styles.percentageInputOverlay} />
              <TextInput
                style={styles.percentageInput}
                value={percentageInput}
                onChangeText={handlePercentageChange}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.percentageSymbol}>%</Text>
            </View>
          </View>

          {/* Validation hint */}
          {direction === 'below' && currentPercentage > 99 && (
            <Text style={styles.validationHint}>Max discount is 99%</Text>
          )}
          {currentPercentage === 0 && (
            <Text style={styles.validationHint}>Enter a percentage (use Dynamic for market price)</Text>
          )}

          {/* Price Preview */}
          <View style={styles.priceDisplayContainer}>
            <View style={styles.priceDisplayOverlay} />
            <View style={styles.priceDisplayContent}>
              <View style={styles.priceDisplayRow}>
                <Text style={styles.priceDisplayLabel}>Market Price</Text>
                <Text style={styles.priceDisplayValue}>{formatPrice(apiPrice)}</Text>
              </View>
              {isValidMargin && (
                <View style={styles.priceDisplayRow}>
                  <Text style={styles.priceDisplayLabel}>
                    Your Price ({direction === 'above' ? '+' : '-'}{currentPercentage}%)
                  </Text>
                  <Text style={[
                    styles.priceDisplayValue, 
                    styles.priceHighlight,
                    direction === 'above' ? styles.priceAbove : styles.priceBelow,
                  ]}>
                    {formatPrice(marginPreviewPrice)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {mode === 'manual' && (
        <Animated.View entering={SlideInDown.duration(200)} style={styles.modeDetails}>
          <View style={styles.inputContainer}>
            <View style={styles.inputOverlay} />
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={manualPrice}
                onChangeText={onManualPriceChange}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Effective Price Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Effective Price</Text>
        <Text style={styles.summaryPrice}>{formatPrice(effectivePrice)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modeOptionActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  modeOptionDisabled: {
    opacity: 0.4,
  },
  modeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  modeOptionTextActive: {
    color: colors.primary,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.smartAmber + '15',
    borderWidth: 1,
    borderColor: colors.smartAmber + '30',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.smartAmber,
    fontWeight: '500',
  },
  modeDetails: {
    gap: 12,
  },
  marginInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  directionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  directionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  directionButtonTextAbove: {
    color: colors.holoGreen,
  },
  directionButtonTextBelow: {
    color: colors.negative,
  },
  percentageInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  percentageInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  percentageInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
    zIndex: 1,
  },
  percentageSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
    paddingRight: 16,
    zIndex: 1,
  },
  validationHint: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  priceDisplayContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceDisplayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  priceDisplayContent: {
    padding: 16,
    gap: 8,
    position: 'relative',
    zIndex: 1,
  },
  priceDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceDisplayLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  priceDisplayValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  priceHighlight: {
    fontSize: 18,
  },
  priceAbove: {
    color: colors.holoGreen,
  },
  priceBelow: {
    color: colors.negative,
  },
  priceDisplayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priceDisplayInfoText: {
    fontSize: 11,
    color: colors.mutedForeground,
    flex: 1,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
    padding: 0,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'JetBrainsMono',
  },
});
