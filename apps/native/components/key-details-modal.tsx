import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { KeyboardSafeSheet } from '@/components/vault';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, Check, X, AlertCircle } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFieldConfigs, parseFieldsIntoSteps, type FieldConfig } from '@/lib/field-configs';
import { updateCollectibleKeyDetails } from '@/lib/api/collectibles';
import { ApiException } from '@/lib/api/client';
import {
  TextFieldRenderer,
  TextAreaFieldRenderer,
  ListFieldRenderer,
  SingleSelectFieldRenderer,
  MultiSelectFieldRenderer,
  ToggleFieldRenderer,
  DropdownFieldRenderer,
  type FieldValue,
} from './key-details/field-renderers';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Skeleton } from './skeleton';
import { logger } from '@/lib/logger';

const log = logger.create('KeyDetails');

interface KeyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  category: string;
  collectibleId?: string;
  onSuccess?: () => void;
  mode?: 'add' | 'edit';
  existingValues?: Record<string, unknown>;
}

export function KeyDetailsModal({ isOpen, onClose, type, category, collectibleId, onSuccess, mode = 'add', existingValues }: KeyDetailsModalProps) {
  const insets = useSafeAreaInsets();
  const isEditMode = mode === 'edit';

  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => parseFieldsIntoSteps(fieldConfigs), [fieldConfigs]);
  const allFields = useMemo(
    () => steps.flatMap((s) => s.fields),
    [steps]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && type && category) {
      fetchFieldConfigs();
    }
  }, [isOpen, type, category]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setShowSuccess(false);
      if (!isEditMode) {
        setFormData({});
      }
    }
  }, [isOpen]);

  // Normalize existing values once field configs are loaded
  useEffect(() => {
    if (!isEditMode || !existingValues || !isOpen || fieldConfigs.length === 0) return;

    const normalized: Record<string, FieldValue> = {};
    const fieldTypeMap = new Map<string, string>();
    for (const fc of fieldConfigs) {
      if (fc.type !== 'section-break') {
        fieldTypeMap.set(fc.id, fc.type);
      }
    }

    for (const [fieldId, raw] of Object.entries(existingValues)) {
      const expectedType = fieldTypeMap.get(fieldId);

      if (expectedType === 'text' || expectedType === 'textarea') {
        if (Array.isArray(raw)) {
          normalized[fieldId] = raw.join(', ');
        } else if (typeof raw === 'number') {
          normalized[fieldId] = String(raw);
        } else if (typeof raw === 'boolean') {
          normalized[fieldId] = raw ? 'Yes' : 'No';
        } else {
          normalized[fieldId] = typeof raw === 'string' ? raw : String(raw ?? '');
        }
      } else if (expectedType === 'list') {
        if (Array.isArray(raw)) {
          normalized[fieldId] = raw.map(String);
        } else if (raw != null) {
          normalized[fieldId] = [String(raw)];
        }
      } else if (expectedType === 'toggle') {
        normalized[fieldId] = !!raw;
      } else {
        if (Array.isArray(raw)) {
          normalized[fieldId] = raw.map(String);
        } else if (typeof raw === 'boolean') {
          normalized[fieldId] = raw;
        } else {
          normalized[fieldId] = typeof raw === 'string' ? raw : String(raw ?? '');
        }
      }
    }

    setFormData(normalized);
  }, [isOpen, isEditMode, existingValues, fieldConfigs]);

  const fetchFieldConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const configs = await getFieldConfigs(type, category);
      setFieldConfigs(configs);
    } catch (err) {
      log.error('Failed to fetch field configs:', err);
      const errorMessage = err instanceof ApiException
        ? err.message
        : 'Failed to load form fields. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[currentStepIndex] || { fields: [], title: '' };
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1 || steps.length === 0;

  // Check if current step is valid (all required fields filled)
  const isStepValid = useMemo(() => {
    return currentStep.fields.every((field) => {
      if (!field.required) return true;
      const value = formData[field.id];
      if (field.type === 'list' || field.type === 'multi-select') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }, [currentStep, formData]);

  const handleFieldChange = (fieldId: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // Only allow going back within steps
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!collectibleId) {
      log.info('Submitting key details (no collectible ID):', formData);
      if (isEditMode) {
        handleEditSaveAndClose();
      } else {
        setShowSuccess(true);
      }
      return;
    }

    try {
      setSubmitting(true);
      await updateCollectibleKeyDetails(collectibleId, formData);
      if (isEditMode) {
        handleEditSaveAndClose();
      } else {
        setShowSuccess(true);
      }
    } catch (err) {
      log.error('Failed to save key details:', err);
      const errorMessage = err instanceof ApiException
        ? err.message
        : 'Failed to save details. Please try again.';
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSaveAndClose = () => {
    setFormData({});
    setCurrentStepIndex(0);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Reset form state
    setCurrentStepIndex(0);
    setFormData({});
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    // Close modal
    onClose();
  };

  const handleClose = () => {
    // Only allow closing if on first step or if showing success
    if (isFirstStep || showSuccess) {
      if (showSuccess) {
        handleSuccessClose();
      } else {
        onClose();
      }
    }
  };

  const storedFieldIds = useMemo(() => {
    if (!isEditMode || !existingValues) return new Set<string>();
    return new Set(Object.keys(existingValues));
  }, [isEditMode, existingValues]);

  const renderField = (field: Exclude<FieldConfig, { type: 'section-break' }>) => {
    const value = formData[field.id];
    const onChange = (newValue: FieldValue) => handleFieldChange(field.id, newValue);
    const hasStoredValue = isEditMode && storedFieldIds.has(field.id);

    switch (field.type) {
      case 'text':
        return <TextFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'textarea':
        return <TextAreaFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'list':
        return <ListFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'single-select':
        return <SingleSelectFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'multi-select':
        return <MultiSelectFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'toggle':
        return <ToggleFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      case 'dropdown':
        return <DropdownFieldRenderer field={field} value={value} onChange={onChange} hasStoredValue={hasStoredValue} />;
      default:
        return null;
    }
  };

  const formatLabel = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalOverlay} />

        <KeyboardSafeSheet style={styles.container}>
          <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              {!isEditMode && !isFirstStep && !showSuccess ? (
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
                  <ArrowLeft size={20} color={colors.foreground} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerSpacer} />
              )}
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>
                  {showSuccess ? 'Details Saved' : isEditMode ? 'Edit Details' : currentStep.title || 'Details & Specs'}
                </Text>
                {!showSuccess && !isEditMode && (
                  <Text style={styles.headerSubtitle}>
                    Step {currentStepIndex + 1} of {steps.length}
                  </Text>
                )}
              </View>
              {(isEditMode || isFirstStep || showSuccess) && (
                <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
                  <X size={20} color={colors.foreground} />
                </TouchableOpacity>
              )}
              {!isEditMode && !isFirstStep && !showSuccess && <View style={styles.headerSpacer} />}
            </View>

            {loading ? (
              /* Loading State - Skeleton Form */
              <View style={styles.loadingContainer}>
                <View style={styles.skeletonGroup}>
                  <Skeleton width={100} height={10} borderRadius={4} />
                  <Skeleton width="100%" height={44} borderRadius={12} />
                </View>
                <View style={styles.skeletonGroup}>
                  <Skeleton width={140} height={10} borderRadius={4} />
                  <Skeleton width="100%" height={44} borderRadius={12} />
                </View>
                <View style={styles.skeletonGroup}>
                  <Skeleton width={120} height={10} borderRadius={4} />
                  <Skeleton width="100%" height={80} borderRadius={12} />
                </View>
                <View style={styles.skeletonGroup}>
                  <Skeleton width={90} height={10} borderRadius={4} />
                  <Skeleton width="100%" height={44} borderRadius={12} />
                </View>
              </View>
            ) : error ? (
              /* Error State */
              <View style={styles.errorContainer}>
                <AlertCircle size={48} color={colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchFieldConfigs}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Retry"
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Skip for now"
                >
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            ) : fieldConfigs.length === 0 ? (
              /* No Fields State */
              <View style={styles.emptyContainer}>
                <Check size={48} color={colors.primary} />
                <Text style={styles.emptyTitle}>No additional fields required</Text>
                <Text style={styles.emptySubtitle}>
                  Your item has been saved. No additional details are needed for this category.
                </Text>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={handleSuccessClose}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.successButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : showSuccess ? (
              /* Success State */
              <View style={styles.successContainer}>
                <Animated.View entering={FadeIn} style={styles.successContent}>
                  <View style={styles.successBadge}>
                    <Check size={24} color={colors.primary} />
                    <Text style={styles.successBadgeText}>Details Saved</Text>
                  </View>
                  <Text style={styles.successTitle}>Your collectible is complete!</Text>
                  <Text style={styles.successSubtitle}>
                    All specifications and provenance details have been saved.
                  </Text>
                  <TouchableOpacity
                    style={styles.successButton}
                    onPress={handleSuccessClose}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                  >
                    <Text style={styles.successButtonText}>Done</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : isEditMode ? (
              <>
                {/* Edit Mode: Flat scrollable form with all fields */}
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  <View style={styles.typeDisplay}>
                    <Text style={styles.typeDisplayText}>
                      {formatLabel(type)} / {formatLabel(category)}
                    </Text>
                  </View>

                  {steps.map((step, stepIndex) => (
                    <View key={`section-${stepIndex}`}>
                      {step.title && (
                        <View style={styles.editSectionHeader}>
                          <Text style={styles.editSectionTitle}>{step.title.toUpperCase()}</Text>
                        </View>
                      )}
                      {step.fields.map((field) => (
                        <View key={field.id}>{renderField(field)}</View>
                      ))}
                    </View>
                  ))}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                  <TouchableOpacity style={styles.backButtonFooter} onPress={onClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cancel">
                    <Text style={styles.backButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nextButton, submitting && styles.nextButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Save changes"
                  >
                    <Text style={styles.nextButtonText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Add Mode: Step-by-step wizard */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${((currentStepIndex + 1) / steps.length) * 100}%` },
                      ]}
                    />
                  </View>
                </View>

                <ScrollView
                  style={styles.content}
                  contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  <View style={styles.typeDisplay}>
                    <Text style={styles.typeDisplayText}>
                      {formatLabel(type)} / {formatLabel(category)}
                    </Text>
                  </View>

                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    {currentStep.fields.map((field) => (
                      <View key={field.id}>{renderField(field)}</View>
                    ))}
                  </Animated.View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                  {!isFirstStep && (
                    <TouchableOpacity
                      style={styles.backButtonFooter}
                      onPress={handleBack}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Previous step"
                    >
                      <ChevronLeft size={20} color={colors.foreground} />
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.nextButton, (!isStepValid || submitting) && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={!isStepValid || submitting}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={isLastStep ? 'Save details' : 'Next step'}
                  >
                    <Text style={styles.nextButtonText}>
                      {submitting ? 'Saving...' : isLastStep ? 'Save Details' : 'Next'}
                    </Text>
                    {!submitting && !isLastStep && <ChevronRight size={20} color={colors.background} />}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardSafeSheet>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  typeDisplay: {
    marginBottom: 24,
  },
  typeDisplayText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderWidth: 1,
    borderColor: colors.primary + '4D',
    marginBottom: 24,
  },
  successBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    minWidth: 120,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  skeletonGroup: {
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  skipButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  editSectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editSectionTitle: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
});
