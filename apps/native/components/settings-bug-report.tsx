import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Check, Camera, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionIcon } from './ui/action-icon';
import { Button } from './ui/button';
import { Toast, ToastType } from './ui/toast';
import { KeyboardSafeScroll } from '@/components/vault';

export function SettingsBugReport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');
  const [showToast, setShowToast] = useState(false);

  const showError = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
  };

  const handleAddScreenshot = () => {
    setScreenshots([...screenshots, `/placeholder-screenshot-${screenshots.length + 1}.jpg`]);
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!title.trim()) return;
    if (!user?.id) {
      showError('You must be signed in to report a bug.');
      return;
    }

    setIsSending(true);
    try {
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;
      const appVersion = Constants.expoConfig?.version ?? 'unknown';

      const { error } = await supabase.from('bug_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        steps_to_reproduce: steps.trim() || null,
        device_info: deviceInfo,
        app_version: appVersion,
      });

      if (error) throw error;

      setSent(true);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to submit bug report. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
            <Text style={styles.headerTitle}>Report Bug</Text>
          </View>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Bug Reported</Text>
          <Text style={styles.successDescription}>
            Thanks for helping us improve Vitrine. We'll investigate and fix this as soon as
            possible.
          </Text>
          <Button
            onPress={() => router.back()}
            style={styles.successBackButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to settings"
          >
            <Text style={styles.successBackButtonText}>Back to Settings</Text>
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
          <Text style={styles.headerTitle}>Report Bug</Text>
        </View>
        <Button
          onPress={handleSend}
          disabled={isSending || !title.trim()}
          size="sm"
          style={styles.sendButton}
          accessibilityRole="button"
          accessibilityLabel="Submit bug report"
        >
          {isSending ? null : <Send size={16} color={colors.primaryForeground} />}
        </Button>
      </View>

      <KeyboardSafeScroll
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.field}>
          <Text style={styles.label}>WHAT WENT WRONG?</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief summary of the issue"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
            accessibilityLabel="Bug title"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DETAILS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened in more detail..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            accessibilityLabel="Bug description"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>STEPS TO REPRODUCE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={steps}
            onChangeText={setSteps}
            placeholder="1. Go to...\n2. Tap on...\n3. See error"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            accessibilityLabel="Steps to reproduce"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>SCREENSHOTS (OPTIONAL)</Text>
          <View style={styles.screenshotsContainer}>
            {screenshots.map((_, index) => (
              <View key={index} style={styles.screenshotItem}>
                <View style={styles.screenshotPlaceholder} />
                <TouchableOpacity
                  onPress={() => handleRemoveScreenshot(index)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Remove screenshot"
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
            {screenshots.length < 3 && (
              <TouchableOpacity
                onPress={handleAddScreenshot}
                style={styles.addScreenshotButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add screenshot"
              >
                <Camera size={20} color={colors.mutedForeground} />
                <Text style={styles.addScreenshotText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Device info and app version are automatically included with your report.
          </Text>
        </View>
      </KeyboardSafeScroll>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
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
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  screenshotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  screenshotItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: 'relative',
  },
  screenshotPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addScreenshotButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addScreenshotText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
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
  successBackButton: {},
  successBackButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryForeground,
  },
});
