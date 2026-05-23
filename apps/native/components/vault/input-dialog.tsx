import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { Button } from './button';

/**
 * InputDialog — cross-platform single-input confirmation modal.
 *
 * The V3 replacement for `Alert.prompt` (which is iOS-only and themed
 * against the system UI rather than the app canvas). Used anywhere a
 * flow needs a short textual answer from the user:
 *   - "Add Tag" in the upload finalize step.
 *   - "Create Showcase" in the ShowcaseSelectorSheet.
 *   - Any future "quick name" dialog (rename collection, add note, etc.).
 *
 * Structure (top → bottom):
 *   - Scrim (tap-to-dismiss via Cancel, 70% black)
 *   - Card (centered): title → optional subtitle → TextInput → button row
 *   - Button row: Cancel (ghost) · Submit (solid, disabled when blank)
 *
 * Submission happens via:
 *   - Save button press
 *   - Keyboard return key (TextInput `onSubmitEditing`)
 *
 * The TextInput is auto-focused on open and auto-cleared on close so
 * reopening the same dialog starts clean unless `initialValue` is set.
 */

export interface InputDialogProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
}

export function InputDialog({
  visible,
  title,
  subtitle,
  placeholder,
  initialValue = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  autoCapitalize = 'sentences',
  maxLength,
}: InputDialogProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, initialValue]);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    onSubmit(trimmed);
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior="padding"
        automaticOffset
        style={styles.root}
      >
        <Pressable style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={handleCancel} />
        <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { borderColor: colors.frostBorderStrong, color: colors.textPrimary, backgroundColor: colors.void }]}
            autoCapitalize={autoCapitalize}
            autoCorrect
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            maxLength={maxLength}
          />

          <View style={styles.actions}>
            <Button label={cancelLabel} variant="ghost" size="sm" onPress={handleCancel} />
            <Button
              label={submitLabel}
              variant="solid"
              size="sm"
              onPress={handleSubmit}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.gutter,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
  },
  title: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -8,
  },
  input: {
    height: 44,
    borderRadius: RADII.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontFamily: TYPE.inter,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
});
