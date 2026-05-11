import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  updateTradingCardPricing,
  formatPrice,
  type PricingMode,
} from '@/lib/api/trading-cards';
import { logger } from '@/lib/logger';

const log = logger.create('EditPricing');

export interface EditPricingData {
  collectibleId: string;
  pricingMode: PricingMode;
  apiPrice?: number | null;
  apiPriceAvailable?: boolean;
  marginPercentage?: number | null;
  manualPrice?: number | null;
}

interface EditPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EditPricingData | null;
  onSaved: () => void;
}

function computePreview(
  mode: PricingMode,
  apiPrice: number | null | undefined,
  marginInput: string,
  manualInput: string,
): number | null {
  if (mode === 'dynamic') {
    return apiPrice ?? null;
  }
  if (mode === 'dynamic_margin') {
    if (apiPrice == null) return null;
    const m = parseInt(marginInput, 10);
    if (!Number.isFinite(m)) return apiPrice;
    return Math.round(apiPrice * (1 + m / 100) * 100) / 100;
  }
  if (mode === 'manual') {
    const n = parseFloat(manualInput);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function EditPricingModal({ isOpen, onClose, data, onSaved }: EditPricingModalProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PricingMode>('dynamic');
  const [marginInput, setMarginInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && isOpen) {
      setMode(data.pricingMode);
      setMarginInput(data.marginPercentage != null ? String(data.marginPercentage) : '');
      setManualInput(data.manualPrice != null ? String(data.manualPrice) : '');
    }
  }, [data, isOpen]);

  const apiPrice = data?.apiPrice ?? null;
  const marketAvailable = data?.apiPriceAvailable !== false && apiPrice != null && apiPrice > 0;
  const preview = computePreview(mode, apiPrice, marginInput, manualInput);

  const handleSave = useCallback(async () => {
    if (!data) return;

    if (mode === 'dynamic_margin') {
      const m = parseInt(marginInput, 10);
      if (!Number.isFinite(m)) {
        Alert.alert('Margin required', 'Enter a whole-number margin (e.g. 15 or -10).');
        return;
      }
      if (m === 0) {
        Alert.alert('Margin invalid', 'Margin cannot be 0. Use "Market price" mode instead.');
        return;
      }
      if (m < -99) {
        Alert.alert('Margin invalid', 'Margin cannot be below -99%.');
        return;
      }
    }

    if (mode === 'manual') {
      const n = parseFloat(manualInput);
      if (!Number.isFinite(n) || n <= 0) {
        Alert.alert('Price required', 'Enter a custom price greater than 0.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateTradingCardPricing({
        collectibleId: data.collectibleId,
        pricingMode: mode,
        marginPercentage: mode === 'dynamic_margin' ? parseInt(marginInput, 10) : undefined,
        manualPrice: mode === 'manual' ? parseFloat(manualInput) : undefined,
      });
      onSaved();
    } catch (err) {
      log.error('Failed to update pricing:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Update failed', message);
    } finally {
      setSaving(false);
    }
  }, [data, mode, marginInput, manualInput, onSaved]);

  const modes: { value: PricingMode; title: string; subtitle: string; disabled?: boolean }[] = [
    {
      value: 'dynamic',
      title: 'Market price',
      subtitle: marketAvailable
        ? `Auto-track the market (${formatPrice(apiPrice)})`
        : 'Tracks market automatically when pricing is available',
      disabled: !marketAvailable,
    },
    {
      value: 'dynamic_margin',
      title: 'Market + margin',
      subtitle: 'Auto-track the market with your margin applied',
      disabled: !marketAvailable,
    },
    {
      value: 'manual',
      title: 'Custom price',
      subtitle: 'Set a fixed price yourself',
    },
  ];

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Pricing</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>PRICING MODE</Text>
          {modes.map((m) => {
            const active = mode === m.value;
            const disabled = !!m.disabled;
            return (
              <TouchableOpacity
                key={m.value}
                onPress={() => !disabled && setMode(m.value)}
                disabled={disabled}
                style={[
                  styles.modeOption,
                  active && styles.modeOptionActive,
                  disabled && styles.modeOptionDisabled,
                ]}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled }}
                accessibilityLabel={m.title}
              >
                <View style={styles.modeTextWrap}>
                  <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>
                    {m.title}
                  </Text>
                  <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    active && styles.radioActive,
                  ]}
                >
                  {active && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {mode === 'dynamic_margin' && (
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Margin percentage</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={marginInput}
                  onChangeText={setMarginInput}
                  placeholder="e.g. 15 or -10"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                  accessibilityLabel="Margin percentage"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
              <Text style={styles.inputHint}>
                Positive for a markup, negative for a discount. Cannot be 0 or below -99.
              </Text>
            </View>
          )}

          {mode === 'manual' && (
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Your price</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  value={manualInput}
                  onChangeText={setManualInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  accessibilityLabel="Custom price"
                />
              </View>
            </View>
          )}

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>NEW EFFECTIVE PRICE</Text>
            <Text style={styles.previewPrice}>
              {preview != null ? formatPrice(preview) : '—'}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
            activeOpacity={0.7}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.7}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save pricing"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 12,
  },
  modeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  modeOptionDisabled: {
    opacity: 0.5,
  },
  modeTextWrap: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  modeTitleActive: {
    color: colors.primary,
  },
  modeSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  inputBlock: {
    marginTop: 6,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginRight: 6,
  },
  inputSuffix: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    paddingVertical: 12,
    fontFamily: 'JetBrainsMono',
  },
  inputHint: {
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 15,
  },
  previewCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.mutedForeground,
  },
  previewPrice: {
    fontSize: 26,
    fontFamily: 'JetBrainsMono',
    fontWeight: 'bold',
    color: colors.foreground,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
});
