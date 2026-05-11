/**
 * RapidFireEdit — focused, one-field-at-a-time edit flow.
 *
 * The "queue then walk through" modal that pairs with the review screen's
 * tap-to-flag pattern. Renders each queued field as its own full-screen
 * page with the correct input control, a progress indicator, and a commit
 * button that advances the queue. On the last step the commit label flips
 * from "Save & Next" to "Save & Review" so the user knows they're returning
 * to the parent surface.
 *
 * Why a dedicated modal (not a step in a wizard router):
 *   - The parent (review screen) stays mounted and alive, so return-to-
 *     review is instant and its scroll / accordion state persists.
 *   - Gestures: swipe-down dismiss works naturally on a modal.
 *   - Keyboard handling: `KeyboardAvoidingView` owns the layout and can
 *     push the commit footer above the keyboard without fighting any
 *     absolutely-positioned chrome.
 *
 * Layout (top → bottom, flex-owned so the keyboard can collapse cleanly):
 *   - Header: Back (first edit → absent; else present) · Progress pips ·
 *             Close X (top-right, always present)
 *   - Scrollable content: field label kicker · description · FieldEditor
 *   - Inline footer: commit button styled to match the canonical
 *     `ActionDock` (sheet-bg surface, frost-border top hairline, volt
 *     brand-volt label). Inline so KAV padding shifts it above the
 *     keyboard.
 *
 * Commit semantics:
 *   - "Save & Next" → stages the current local edit, advances the index.
 *   - "Save & Review" (last step) → stages, then submits all local edits
 *     to the parent via `onSubmit` and dismisses.
 *   - Close (X / swipe-down): if any edits are staged, confirm via alert
 *     (Save / Discard / Keep Editing). If nothing staged, dismiss
 *     immediately.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Check, ChevronLeft, X } from 'lucide-react-native';

import { useTheme, SPACING, TYPE } from '@/lib/design';
import { FieldEditor, type FieldEditorValue } from './field-editor';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface RapidFireEditItem {
  id: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean';
  currentValue: unknown;
  multiline?: boolean;
}

export interface RapidFireEditProps {
  visible: boolean;
  items: RapidFireEditItem[];
  title?: string;
  onSubmit: (edits: Record<string, FieldEditorValue>, editedIds: string[]) => void;
  onCancel: () => void;
}

function coerceInitial(v: unknown): FieldEditorValue {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map((x) => String(x)).join(', ');
  return String(v);
}

export function RapidFireEdit({
  visible,
  items,
  title = 'Make Edits',
  onSubmit,
  onCancel,
}: RapidFireEditProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, FieldEditorValue>>({});

  // Reset each time the modal opens — a fresh queue is a fresh session.
  useEffect(() => {
    if (visible) {
      setIndex(0);
      setDrafts({});
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        mass: 0.9,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const animateOut = (after: () => void) => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(after);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.8) {
          requestClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  const current = items[index];
  const isFirst = index === 0;
  const isLast = index === items.length - 1;
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const currentValue = useMemo<FieldEditorValue>(() => {
    if (!current) return null;
    if (Object.prototype.hasOwnProperty.call(drafts, current.id)) {
      return drafts[current.id];
    }
    return coerceInitial(current.currentValue);
  }, [current, drafts]);

  const editedIds = useMemo(() => Object.keys(drafts), [drafts]);
  const hasStagedEdits = editedIds.length > 0;

  const setCurrentValue = (next: FieldEditorValue) => {
    if (!current) return;
    setDrafts((d) => ({ ...d, [current.id]: next }));
  };

  const handleNext = () => {
    if (isLast) {
      // Flush on submit — capture the freshest drafts in case of races.
      const finalDrafts = draftsRef.current;
      animateOut(() => onSubmit(finalDrafts, Object.keys(finalDrafts)));
      return;
    }
    setIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setIndex((i) => i - 1);
  };

  const requestClose = () => {
    if (!hasStagedEdits) {
      animateOut(onCancel);
      return;
    }
    Alert.alert(
      `Save ${editedIds.length} edit${editedIds.length === 1 ? '' : 's'} and exit?`,
      'You can re-flag any remaining fields back on the review screen.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => animateOut(onCancel),
        },
        {
          text: 'Save',
          onPress: () => {
            const finalDrafts = draftsRef.current;
            animateOut(() => onSubmit(finalDrafts, Object.keys(finalDrafts)));
          },
        },
      ],
    );
  };

  if (!current) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.root,
          {
            paddingTop: insets.top,
            transform: [{ translateY }],
            backgroundColor: colors.void,
          },
        ]}
      >
        <View
          style={[styles.header, { borderBottomColor: colors.frostDivider }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.headerSide}>
            {!isFirst ? (
              <Pressable
                onPress={handleBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Previous edit"
                style={styles.headerIconBtn}
              >
                <ChevronLeft size={20} color={colors.textPrimary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerKicker, { color: colors.textTertiary }]}>
              {title.toUpperCase()}
            </Text>
            <Text style={[styles.headerProgress, { color: colors.textPrimary }]}>
              EDIT {index + 1} OF {items.length}
            </Text>
            <View style={styles.pipsRow}>
              {items.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pip,
                    {
                      backgroundColor: i === index
                        ? colors.brandVolt
                        : i < index
                          ? colors.textSecondary
                          : colors.frostBorderStrong,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.headerSide}>
            <Pressable
              onPress={requestClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close edits"
              style={styles.headerIconBtn}
            >
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.body}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FieldEditor
              key={current.id}
              label={current.label}
              description={current.description}
              type={current.type}
              value={currentValue}
              onChange={setCurrentValue}
              multiline={current.multiline}
              autoFocus
            />
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 14),
                backgroundColor: colors.sheetBg,
                borderTopColor: colors.frostBorder,
              },
            ]}
          >
            <Pressable
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Save and review' : 'Save and next'}
              style={({ pressed }) => [
                styles.footerBtn,
                pressed && { opacity: 0.72 },
              ]}
            >
              <Text style={[styles.footerBtnLabel, { color: colors.brandVolt }]}>
                {isLast ? 'Save & Review' : 'Save & Next'}
              </Text>
              {isLast ? (
                <Check size={14} color={colors.brandVolt} strokeWidth={2} />
              ) : (
                <ArrowRight size={14} color={colors.brandVolt} strokeWidth={2} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: SPACING.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  headerSide: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  headerProgress: {
    fontFamily: TYPE.interMedium,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  pip: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
    paddingBottom: SPACING.zoneCluster,
    gap: SPACING.zoneIntra,
  },
  footer: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
  },
  footerBtnLabel: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
});
