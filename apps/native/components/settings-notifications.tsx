import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToggleSwitch } from './ui/toggle-switch';
import { Toast } from './ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreference,
  type PreferenceSection,
} from '@/lib/api/notifications';

const SECTION_ORDER: PreferenceSection[] = ['INBOX', 'SIGNALS', 'JOURNAL'];

const SECTION_KICKERS: Record<PreferenceSection, string> = {
  INBOX: 'Social signals from other collectors',
  SIGNALS: 'System-discovered events about your stuff',
  JOURNAL: 'Your own actions',
};

export function SettingsNotifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Notification settings saved');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const navigateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setIsLoadingPrefs(true);
    getNotificationPreferences(user.id)
      .then(setNotifications)
      .finally(() => setIsLoadingPrefs(false));
  }, [user?.id]);

  useEffect(() => {
    return () => { if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current); };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<PreferenceSection, NotificationPreference[]>();
    for (const section of SECTION_ORDER) map.set(section, []);
    for (const pref of notifications) map.get(pref.section)?.push(pref);
    return map;
  }, [notifications]);

  const toggleNotification = (key: string) => {
    setNotifications(notifications.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n)));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    const success = await saveNotificationPreferences(user.id, notifications);
    setIsSaving(false);
    if (success) {
      setToastMessage('Notification settings saved');
      setToastType('success');
      setShowToast(true);
      navigateTimerRef.current = setTimeout(() => router.back(), 1500);
    } else {
      setToastMessage('Failed to save settings');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isLoadingPrefs}
          style={[s.saveBtn, { backgroundColor: colors.brandVolt }]}
          accessibilityRole="button"
          accessibilityLabel="Save notification settings"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Check size={16} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
        {isLoadingPrefs ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandVolt} />
          </View>
        ) : (
          SECTION_ORDER.map((section) => {
            const items = grouped.get(section) ?? [];

            if (section === 'JOURNAL') {
              return (
                <View key={section} style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{section}</Text>
                    <Text style={[s.sectionKicker, { color: colors.textTertiary }]}>{SECTION_KICKERS[section]}</Text>
                  </View>
                  <View style={[s.infoBlock, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                    <Text style={[s.infoTitle, { color: colors.textPrimary }]}>Always on, never pushed</Text>
                    <Text style={[s.infoBody, { color: colors.textSecondary }]}>
                      Your own activity — items you list, showcases you create, and edits you make — is shown in your Activity feed and is never sent as a notification.
                    </Text>
                  </View>
                </View>
              );
            }

            if (items.length === 0) return null;

            return (
              <View key={section} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{section}</Text>
                  <Text style={[s.sectionKicker, { color: colors.textTertiary }]}>{SECTION_KICKERS[section]}</Text>
                </View>
                <View style={[s.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                  {items.map((notification, index) => (
                    <View
                      key={notification.key}
                      style={[s.listItem, index < items.length - 1 && [s.listItemBorder, { borderBottomColor: colors.frostDivider }]]}
                    >
                      <View style={s.listItemContent}>
                        <Text style={[s.listItemLabel, { color: colors.textPrimary }]}>{notification.label}</Text>
                        <Text style={[s.listItemDescription, { color: colors.textSecondary }]}>{notification.description}</Text>
                      </View>
                      <ToggleSwitch
                        value={notification.enabled}
                        onValueChange={() => toggleNotification(notification.key)}
                        accessibilityRole="switch"
                        accessibilityLabel={notification.label}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Toast message={toastMessage} type={toastType} visible={showToast} onDismiss={() => setShowToast(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.gutter,
    paddingBottom: 48,
    gap: SPACING.sectionGap,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  section: {
    gap: SPACING.kickerGap,
  },
  sectionHeader: {
    paddingLeft: 4,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionKicker: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.rowPadX,
  },
  listItemBorder: {
    borderBottomWidth: 1,
  },
  listItemContent: {
    flex: 1,
    paddingRight: 16,
  },
  listItemLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
    marginBottom: 3,
  },
  listItemDescription: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  infoBlock: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    padding: SPACING.rowPadX,
    gap: 6,
  },
  infoTitle: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
  infoBody: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 18,
  },
});
