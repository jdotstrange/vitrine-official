import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Check, ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionIcon } from './ui/action-icon';
import { Button } from './ui/button';
import { BottomSheetPicker } from './ui/bottom-sheet-picker';
import { Toast } from './ui/toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/contexts/auth-context';
import { KeyboardSafeScroll } from '@/components/vault';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

function categoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function SettingsSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'error',
    visible: false,
  });

  const handleSend = async () => {
    if (!subject.trim() || !message.trim() || !user?.id) return;

    setIsSending(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      category,
    });
    setIsSending(false);

    if (error) {
      setToast({ message: 'Failed to send message. Please try again.', type: 'error', visible: true });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
            <Text style={styles.headerTitle}>Contact Support</Text>
          </View>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Message Sent</Text>
          <Text style={styles.successDescription}>
            We've received your message and will get back to you within 24-48 hours.
          </Text>
          <Button
            onPress={() => router.back()}
            style={styles.successBackBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to settings"
          >
            <Text style={styles.successBackBtnText}>Back to Settings</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>
        <Button
          onPress={handleSend}
          disabled={isSending || !subject.trim() || !message.trim()}
          size="sm"
          style={styles.sendButton}
          accessibilityRole="button"
          accessibilityLabel="Send support message"
        >
          {isSending ? null : <Send size={16} color={colors.primaryForeground} />}
        </Button>
      </View>

      <KeyboardSafeScroll
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.field}>
          <Text style={styles.label}>CATEGORY</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select category"
          >
            <Text style={styles.pickerTriggerText}>{categoryLabel(category)}</Text>
            <ChevronDown size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>SUBJECT</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="What can we help with?"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Subject"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>MESSAGE</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question in detail..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={8}
            accessibilityLabel="Message"
          />
        </View>

        <Text style={styles.hint}>
          We typically respond within 24-48 hours. For urgent issues, include "URGENT" in your
          subject line.
        </Text>
      </KeyboardSafeScroll>

      <BottomSheetPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        options={CATEGORY_OPTIONS}
        selectedValue={category}
        onSelect={setCategory}
        label="Category"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerTriggerText: {
    fontSize: 16,
    color: colors.foreground,
  },
  hint: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  successBackBtn: {},
  successBackBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryForeground,
  },
});
