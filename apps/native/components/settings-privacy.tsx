import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, Lock } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetPicker } from './ui/bottom-sheet-picker';
import { Toast } from './ui/toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/contexts/auth-context';

type SharingPermission = 'public' | 'followers' | 'private';
type MessagingPermission = 'everyone' | 'following' | 'nobody';
type FollowListsVisibility = 'public' | 'private';

interface PrivacySetting {
  key: string;
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  comingSoon?: boolean;
}

const SHARING_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'followers', label: 'Followers Only' },
  { value: 'private', label: 'Off' },
];

const MESSAGING_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'following', label: 'People I Follow' },
  { value: 'nobody', label: 'Nobody' },
];

const FOLLOW_LISTS_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const COMING_SOON_SETTINGS: PrivacySetting[] = [
  {
    key: 'profile_visibility',
    label: 'Profile Visibility',
    description: 'Control who can see your profile',
    value: 'public',
    options: [{ value: 'public', label: 'Public' }],
    comingSoon: true,
  },
  {
    key: 'collection_visibility',
    label: 'Collection Visibility',
    description: 'Control who can see your collection',
    value: 'public',
    options: [{ value: 'public', label: 'Public' }],
    comingSoon: true,
  },
];

export function SettingsPrivacy() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingPermission, setSharingPermission] = useState<SharingPermission>('public');
  const [messagingPermission, setMessagingPermission] = useState<MessagingPermission>('everyone');
  const [followListsVisibility, setFollowListsVisibility] = useState<FollowListsVisibility>('public');
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current); };
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('sharing_permission, messaging_permission, follow_lists_visibility')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      if (data) {
        setSharingPermission((data.sharing_permission as SharingPermission) ?? 'public');
        setMessagingPermission((data.messaging_permission as MessagingPermission) ?? 'everyone');
        setFollowListsVisibility((data.follow_lists_visibility as FollowListsVisibility) ?? 'public');
      }
    } catch {
      setToast({ message: 'Failed to load privacy settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const settings: PrivacySetting[] = [
    { key: 'sharing_permission', label: 'Share Links', description: 'Who can share links to your showcases', value: sharingPermission, options: SHARING_OPTIONS },
    { key: 'messaging_permission', label: 'Who Can Message Me', description: 'Control who can send you direct messages', value: messagingPermission, options: MESSAGING_OPTIONS },
    { key: 'follow_lists_visibility', label: 'Followers & Following', description: 'Who can see your followers and following lists', value: followListsVisibility, options: FOLLOW_LISTS_OPTIONS },
    ...COMING_SOON_SETTINGS,
  ];

  const updateSetting = (key: string, value: string) => {
    if (key === 'sharing_permission') setSharingPermission(value as SharingPermission);
    if (key === 'messaging_permission') setMessagingPermission(value as MessagingPermission);
    if (key === 'follow_lists_visibility') setFollowListsVisibility(value as FollowListsVisibility);
    setPickerOpen(null);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ sharing_permission: sharingPermission, messaging_permission: messagingPermission, follow_lists_visibility: followListsVisibility })
        .eq('id', user.id);
      if (error) throw error;
      setToast({ message: 'Privacy settings saved', type: 'success' });
      navigateTimerRef.current = setTimeout(() => router.back(), 1200);
    } catch {
      setToast({ message: 'Failed to save settings. Try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentSetting = settings.find((item) => pickerOpen === item.key && !item.comingSoon);

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.void }]}>
        <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Privacy Settings</Text>
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandVolt} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Privacy Settings</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[s.saveBtn, { backgroundColor: colors.brandVolt }]}
          accessibilityRole="button"
          accessibilityLabel="Save privacy settings"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Check size={16} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
        {settings.map((setting) => {
          const disabled = !!setting.comingSoon;
          const displayLabel = setting.options.find((o) => o.value === setting.value)?.label ?? setting.value;

          return (
            <View key={setting.key} style={[s.settingItem, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, disabled && s.settingItemDisabled]}>
              <View style={s.settingContent}>
                <View style={s.labelRow}>
                  <Text style={[s.settingLabel, { color: colors.textPrimary }]}>{setting.label}</Text>
                  {disabled && (
                    <View style={[s.comingSoonBadge, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                      <Lock size={10} color={colors.textTertiary} />
                      <Text style={[s.comingSoonText, { color: colors.textTertiary }]}>Coming Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.settingDescription, { color: colors.textSecondary }]}>{setting.description}</Text>
              </View>
              <TouchableOpacity
                onPress={disabled ? undefined : () => setPickerOpen(setting.key)}
                style={[s.settingValue, { borderTopColor: colors.frostDivider }]}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`${setting.label} selector`}
              >
                <Text style={[s.settingValueText, { color: colors.textPrimary }]}>{displayLabel}</Text>
                {!disabled && <ChevronDown size={18} color={colors.textTertiary} />}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {currentSetting && (
        <BottomSheetPicker
          isOpen={pickerOpen === currentSetting.key}
          onClose={() => setPickerOpen(null)}
          options={currentSetting.options}
          selectedValue={currentSetting.value}
          onSelect={(value) => updateSetting(currentSetting.key, value)}
          label={currentSetting.label}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} visible={!!toast} onDismiss={() => setToast(null)} />
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.gutter,
    gap: SPACING.zoneIntra,
    paddingBottom: 32,
  },
  settingItem: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    padding: SPACING.rowPadX,
    gap: 12,
  },
  settingItemDisabled: {
    opacity: 0.4,
  },
  settingContent: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  settingDescription: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  settingValueText: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sharp,
  },
  comingSoonText: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
