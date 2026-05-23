import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useState, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMockFieldConfigs, parseFieldsIntoSteps, type FieldConfig } from '@/lib/field-configs';
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
import { logger } from '@/lib/logger';

const log = logger.create('KeyDetails');

export function KeyDetailsForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string; category: string; collectibleId?: string }>();

  const type = params.type || '';
  const category = params.category || '';
  const collectibleId = params.collectibleId;

  // Get field configurations and parse into steps
  const fieldConfigs = useMemo(() => getMockFieldConfigs(type, category), [type, category]);
  const steps = useMemo(() => parseFieldsIntoSteps(fieldConfigs), [fieldConfigs]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

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
    // Only allow going back within steps, not to previous screen
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
    // If on first step, do nothing (prevents accidental navigation away)
  };

  const handleSubmit = () => {
    // In production, this would POST to /api/collectibles/:id/key-details
    log.info('Submitting key details:', formData);
    // Navigate to key details success screen
    router.replace({
      pathname: '/upload/memorabilia/[type]/[category]/details/success',
      params: {
        type: type || '',
        category: category || '',
        collectibleId: collectibleId || '',
      },
    });
  };

  const renderField = (field: Exclude<FieldConfig, { type: 'section-break' }>) => {
    const value = formData[field.id];
    const onChange = (newValue: FieldValue) => handleFieldChange(field.id, newValue);

    switch (field.type) {
      case 'text':
        return <TextFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'textarea':
        return <TextAreaFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'list':
        return <ListFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'single-select':
        return <SingleSelectFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'multi-select':
        return <MultiSelectFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'toggle':
        return <ToggleFieldRenderer field={field} value={value} onChange={onChange} />;
      case 'dropdown':
        return <DropdownFieldRenderer field={field} value={value} onChange={onChange} />;
      default:
        return null;
    }
  };

  const formatLabel = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      automaticOffset
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          {!isFirstStep ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Previous step">
              <ArrowLeft size={20} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{currentStep.title || 'Details & Specs'}</Text>
            <Text style={styles.headerSubtitle}>
              Step {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStepIndex && styles.progressDotActive,
                index < currentStepIndex && styles.progressDotCompleted,
              ]}
            >
              {index < currentStepIndex && (
                <Check size={12} color={colors.background} />
              )}
            </View>
          ))}
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Type/Category Display */}
          <View style={styles.typeDisplay}>
            <Text style={styles.typeDisplayText}>
              {formatLabel(type)} / {formatLabel(category)}
            </Text>
          </View>

          {/* Fields */}
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            {currentStep.fields.map((field) => (
              <View key={field.id}>{renderField(field)}</View>
            ))}
          </Animated.View>
        </ScrollView>

        {/* Footer Actions */}
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
            style={[styles.nextButton, !isStepValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isStepValid}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? 'Save details' : 'Next step'}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Save Details' : 'Next'}
            </Text>
            {!isLastStep && <ChevronRight size={20} color={colors.background} />}
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '1A',
  },
  progressDotCompleted: {
    borderColor: colors.primary,
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
  headerSpacer: {
    width: 40,
  },
});
