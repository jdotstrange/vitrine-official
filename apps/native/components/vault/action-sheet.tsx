import React, { useEffect } from 'react';
import {
  ActionSheetIOS,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, RADII, TYPE } from '@/lib/design';

export interface ActionSheetOption {
  label: string;
  /** Renders the option in destructive (red) treatment. */
  destructive?: boolean;
  /** Renders the option as the affirmative/highlighted variant. */
  preferred?: boolean;
  onPress: () => void;
}

export interface ActionSheetProps {
  visible: boolean;
  /** Optional sheet title rendered above the option list. */
  title?: string;
  /** Optional secondary line under the title for context. */
  message?: string;
  options: ActionSheetOption[];
  /** Label for the dismiss action. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Called when the user dismisses the sheet without selecting an option, OR
   * after an option's `onPress` callback has run. The component never closes
   * itself — the parent owns the `visible` state.
   */
  onClose: () => void;
}

/**
 * Cross-platform action sheet primitive. On iOS this delegates to
 * `ActionSheetIOS.showActionSheetWithOptions` so the sheet matches the system
 * sheet exactly (correct safe-area handling, blur, swipe-down). On Android we
 * render a V3-styled bottom sheet (sheetBg surface, frostBorder hairline, top
 * grab handle, vertical option list, separated cancel row).
 *
 * Imperative-on-iOS, declarative-on-Android, but the public API is the same:
 * the parent toggles `visible` and waits for `onClose`.
 *
 * Usage:
 *   <ActionSheet
 *     visible={menuVisible}
 *     title="Showcase actions"
 *     options={[
 *       { label: 'Mark Featured', onPress: handleFeature },
 *       { label: 'Edit Showcase', onPress: handleEdit },
 *       { label: 'Delete Showcase', destructive: true, onPress: handleDelete },
 *     ]}
 *     onClose={() => setMenuVisible(false)}
 *   />
 */
export function ActionSheet({
  visible,
  title,
  message,
  options,
  cancelLabel = 'Cancel',
  onClose,
}: ActionSheetProps) {
  // ── iOS path ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') return;

    const labels = options.map((o) => o.label);
    const cancelButtonIndex = labels.length;
    const destructiveButtonIndex = options.findIndex((o) => o.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...labels, cancelLabel],
        cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
        userInterfaceStyle: 'dark',
      },
      (selected) => {
        if (selected != null && selected < options.length) {
          options[selected].onPress();
        }
        onClose();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (Platform.OS === 'ios') return null;

  // ── Android path ──────────────────────────────────────────────────────
  return (
    <AndroidActionSheet
      visible={visible}
      title={title}
      message={message}
      options={options}
      cancelLabel={cancelLabel}
      onClose={onClose}
    />
  );
}

function AndroidActionSheet({
  visible,
  title,
  message,
  options,
  cancelLabel,
  onClose,
}: Required<Pick<ActionSheetProps, 'cancelLabel'>> & ActionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[a.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={[a.sheet, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder, paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <View style={[a.handle, { backgroundColor: colors.frostBorderStrong }]} />
          {(title || message) ? (
            <View style={[a.header, { borderBottomColor: colors.frostDivider }]}>
              {title ? <Text style={[a.title, { color: colors.textSecondary }]}>{title}</Text> : null}
              {message ? <Text style={[a.message, { color: colors.textTertiary }]}>{message}</Text> : null}
            </View>
          ) : null}
          <View style={a.optionList}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={`${option.label}-${index}`}
                style={[
                  a.optionRow,
                  index < options.length - 1 && [a.optionRowDivider, { borderBottomColor: colors.frostDivider }],
                ]}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <Text
                  style={[
                    a.optionLabel,
                    { color: colors.textPrimary },
                    option.destructive && { color: colors.semanticRed },
                    option.preferred && { color: colors.brandVolt },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[a.cancelRow, { borderColor: colors.frostBorderStrong }]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={[a.cancelLabel, { color: colors.textSecondary }]}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const a = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADII.medium,
    borderTopRightRadius: RADII.medium,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 4,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: TYPE.groteskBold,
    fontSize: 12,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  message: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    textAlign: 'center',
  },
  optionList: {
    paddingVertical: 4,
  },
  optionRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionRowDivider: {
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 16,
  },
  cancelRow: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: RADII.medium,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 14,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
});
