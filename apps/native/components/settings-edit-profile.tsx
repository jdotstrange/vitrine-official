import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActionSheetIOS, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastType } from './ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { uploadAvatar, deleteAvatar, completeProfile } from '@/lib/api/auth';

export function SettingsEditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, refreshProfileStatus } = useAuth();
  const { colors } = useTheme();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const navigateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    };
  }, []);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [profile, setProfile] = useState({
    avatar: '',
    name: '',
    username: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        avatar: user.avatarUrl || '',
        name: user.displayName || '',
        username: user.username || '',
        bio: user.bio ?? '',
      });
    }
  }, [user]);

  const getInitials = (name: string): string => {
    if (!name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const showToastMessage = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleAvatarPress = () => {
    const options = profile.avatar
      ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Library', 'Cancel'];

    const destructiveIndex = profile.avatar ? 2 : undefined;
    const cancelIndex = profile.avatar ? 3 : 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) pickImageFromCamera();
          else if (buttonIndex === 1) pickImageFromLibrary();
          else if (buttonIndex === 2 && profile.avatar) handleRemoveAvatar();
        },
      );
    } else {
      Alert.alert('Change Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: pickImageFromCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        ...(profile.avatar ? [{ text: 'Remove Photo', onPress: handleRemoveAvatar, style: 'destructive' as const }] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToastMessage('Camera permission is required', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled) await handleAvatarUpload(result.assets[0]);
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToastMessage('Photo library permission is required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) await handleAvatarUpload(result.assets[0]);
  };

  const handleAvatarUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!token) { showToastMessage('Not authenticated', 'error'); return; }
    setIsUploadingAvatar(true);
    try {
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const response = await uploadAvatar(user!.id, asset.uri, filename);
      setProfile({ ...profile, avatar: response.avatarUrl });
      showToastMessage('Photo updated!', 'success');
      await refreshProfileStatus();
    } catch (error: unknown) {
      showToastMessage(error instanceof Error ? error.message : 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!token) { showToastMessage('Not authenticated', 'error'); return; }
    setIsUploadingAvatar(true);
    try {
      await deleteAvatar(user!.id);
      setProfile({ ...profile, avatar: '' });
      showToastMessage('Photo removed', 'success');
      await refreshProfileStatus();
    } catch (error: unknown) {
      showToastMessage(error instanceof Error ? error.message : 'Failed to remove photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) { showToastMessage('Display name is required', 'error'); return; }
    if (!token || !user?.id) { showToastMessage('Not authenticated', 'error'); return; }
    setIsSaving(true);
    try {
      const updates: { displayName?: string; bio?: string | null } = {};
      if (profile.name !== user?.displayName) updates.displayName = profile.name.trim();
      if (profile.bio !== (user?.bio ?? '')) updates.bio = profile.bio.trim() || null;
      if (Object.keys(updates).length > 0) {
        await completeProfile(user.id, updates);
        await refreshProfileStatus();
      }
      showToastMessage('Profile saved successfully', 'success');
      navigateTimerRef.current = setTimeout(() => router.back(), 1500);
    } catch (error: unknown) {
      showToastMessage(error instanceof Error ? error.message : 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[s.saveBtn, { backgroundColor: colors.brandVolt }]}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Check size={16} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={[s.avatarSection, { borderBottomColor: colors.frostDivider }]}>
          <TouchableOpacity
            style={s.avatarTouchable}
            activeOpacity={0.8}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <View style={s.avatarWrapper}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={[s.avatarImage, { borderColor: colors.brandVolt }]} accessibilityLabel="Profile photo" />
              ) : (
                <View style={[s.avatarInitials, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                  <Text style={[s.avatarInitialsText, { color: colors.textTertiary }]}>{getInitials(profile.name)}</Text>
                </View>
              )}
              <View style={[s.avatarOverlay, { backgroundColor: colors.sheetBg, borderColor: colors.void }]}>
                {isUploadingAvatar ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Camera size={24} color="#ffffff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[s.avatarHint, { color: colors.textSecondary }]}>Tap to change photo</Text>
        </View>

        <View style={s.form}>
          <View style={s.field}>
            <Text style={[s.label, { color: colors.textPrimary }]}>Display Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder, color: colors.textPrimary }]}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              accessibilityLabel="Display name"
            />
            <Text style={[s.fieldHint, { color: colors.textTertiary }]}>This is how you'll appear to other collectors</Text>
          </View>

          <View style={s.field}>
            <View style={s.labelRow}>
              <Text style={[s.label, { color: colors.textPrimary }]}>Username</Text>
              <View style={[s.lockedBadge, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
                <Lock size={10} color={colors.textTertiary} />
                <Text style={[s.lockedText, { color: colors.textTertiary }]}>Locked</Text>
              </View>
            </View>
            <View style={[s.readOnlyField, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
              <Text style={[s.readOnlyPrefix, { color: colors.textTertiary }]}>@</Text>
              <Text style={[s.readOnlyValue, { color: colors.textSecondary }]}>{profile.username || 'username'}</Text>
            </View>
            <Text style={[s.fieldHint, { color: colors.textTertiary }]}>vitrine.app/{profile.username || 'username'}</Text>
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: colors.textPrimary }]}>Bio</Text>
            <TextInput
              style={[s.input, s.bioInput, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder, color: colors.textPrimary }]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text.slice(0, 160) })}
              placeholder="A short tagline or description (optional)"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={161}
              numberOfLines={3}
              accessibilityLabel="Bio"
            />
            <Text style={[s.fieldHint, { color: colors.textTertiary }]}>{profile.bio.length}/160</Text>
          </View>
        </View>
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
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.zoneCluster,
    borderBottomWidth: 1,
  },
  avatarTouchable: {
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  avatarInitials: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 40,
    letterSpacing: 1,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  form: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.sectionGap,
    gap: SPACING.sectionGap,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sharp,
    borderWidth: 1,
  },
  lockedText: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: TYPE.inter,
    fontSize: 16,
  },
  fieldHint: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    marginTop: 4,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.6,
  },
  readOnlyPrefix: {
    fontFamily: TYPE.mono,
    fontSize: 16,
    marginRight: 2,
  },
  readOnlyValue: {
    fontFamily: TYPE.mono,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
});
