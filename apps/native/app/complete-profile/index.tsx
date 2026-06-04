import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated as RNAnimated,
  ActivityIndicator,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Button, KeyboardSafeScroll } from '@/components/vault';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { VitrineLogo } from '@/components/vitrine-logo';
import { RADII, TYPE, useTheme } from '@/lib/design';
import { SPLASH_BG } from '@/lib/splash-contain-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { checkUsername, checkEmail, uploadAvatar } from '@/lib/api/auth';

type FieldStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

type MissingField = 'displayName' | 'username' | 'email';
type CompleteProfileStep = 'required-fields' | 'finish-profile';

export default function CompleteProfilePage() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profileStatus, updateProfile, user, logout } = useAuth();

  const missingFields = profileStatus?.missing || [];
  const currentField = missingFields[0] as MissingField | undefined;
  const totalFieldsRemaining = missingFields.length;

  // Track which overall step we're on
  const [step, setStep] = useState<CompleteProfileStep>('required-fields');

  // Form state for required fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Validation state
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle');

  // Bio + Avatar state (optional finish step)
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    return () => {
      Object.values(checkTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // When required fields are all done, transition to finish-profile step
  useEffect(() => {
    if (profileStatus?.isComplete && step === 'required-fields') {
      setStep('finish-profile');
    }
  }, [profileStatus?.isComplete]);

  useEffect(() => {
    const status = getCurrentFieldStatus();
    const showGlow = status === 'available' || status === 'unavailable' || status === 'invalid';
    RNAnimated.timing(glowOpacity, {
      toValue: showGlow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [usernameStatus, emailStatus]);

  const getCurrentFieldStatus = (): FieldStatus => {
    switch (currentField) {
      case 'username': return usernameStatus;
      case 'email': return emailStatus;
      default: return 'idle';
    }
  };

  const isValidDisplayName = displayName.trim().length >= 2 && displayName.trim().length <= 50;
  const isValidUsername = /^[a-z0-9_]{3,20}$/.test(username);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleUsernameCheck = async (value: string) => {
    if (!value || !(/^[a-z0-9_]{3,20}$/.test(value))) {
      setUsernameStatus(value && !(/^[a-z0-9_]{3,20}$/.test(value)) ? 'invalid' : 'idle');
      return;
    }

    setUsernameStatus('checking');
    try {
      const result = await checkUsername(value);
      setUsernameStatus(result.available ? 'available' : 'unavailable');
      if (!result.available) setError('Username is already taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleEmailCheck = async (value: string) => {
    if (!value || !isValidEmail) {
      setEmailStatus(value && !isValidEmail ? 'invalid' : 'idle');
      return;
    }

    setEmailStatus('checking');
    try {
      const result = await checkEmail(value);
      setEmailStatus(result.available ? 'available' : 'unavailable');
      if (!result.available) setError('Email is already registered');
    } catch {
      setEmailStatus('idle');
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    setError('');

    if (checkTimeouts.current.username) clearTimeout(checkTimeouts.current.username);
    checkTimeouts.current.username = setTimeout(() => handleUsernameCheck(sanitized), 500);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');

    if (checkTimeouts.current.email) clearTimeout(checkTimeouts.current.email);
    checkTimeouts.current.email = setTimeout(() => handleEmailCheck(value), 500);
  };

  const isCurrentFieldValid = (): boolean => {
    switch (currentField) {
      case 'displayName': return isValidDisplayName;
      case 'username': return isValidUsername && usernameStatus === 'available';
      case 'email': return isValidEmail && emailStatus === 'available';
      default: return false;
    }
  };

  const handleContinue = async () => {
    if (!isCurrentFieldValid()) return;

    setIsLoading(true);
    setError('');

    try {
      const updateData: { [key: string]: string } = {};
      switch (currentField) {
        case 'displayName':
          updateData.displayName = displayName.trim();
          break;
        case 'username':
          updateData.username = username;
          break;
        case 'email':
          updateData.email = email;
          break;
      }

      await updateProfile(updateData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Bio + Avatar (finish profile) ---

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) pickImageFromCamera();
          else if (buttonIndex === 1) pickImageFromLibrary();
        }
      );
    } else {
      Alert.alert('Profile Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: pickImageFromCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const markOnboardingComplete = async () => {
    if (!user?.id) return;
    const { supabase } = await import('@/lib/supabase');
    await supabase
      .from('users')
      .update({ onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  const handleFinishProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (avatarUri && user?.id) {
        setIsUploadingAvatar(true);
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        await uploadAvatar(user.id, avatarUri, filename);
        setIsUploadingAvatar(false);
      }

      if (bio.trim()) {
        await updateProfile({ displayName: user?.displayName || undefined, username: user?.username || undefined });
        const { error: bioError } = await (await import('@/lib/supabase')).supabase
          .from('users')
          .update({ bio: bio.trim(), updated_at: new Date().toISOString() })
          .eq('id', user?.id);
        if (bioError) throw new Error(bioError.message);
      }

      await markOnboardingComplete();
      await updateProfile({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
      setIsUploadingAvatar(false);
    }
  };

  const handleSkipFinish = async () => {
    await markOnboardingComplete();
    await updateProfile({});
  };

  const getGlowColor = (): string => {
    const status = getCurrentFieldStatus();
    if (status === 'available') return colors.semanticGreen;
    if (status === 'unavailable' || status === 'invalid') return colors.semanticRed;
    return colors.brandVolt;
  };

  // --- Render required field content ---
  const renderFieldContent = () => {
    const status = getCurrentFieldStatus();
    const showGlow = status === 'available' || status === 'unavailable' || status === 'invalid';

    switch (currentField) {
      case 'displayName':
        return (
          <>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>What should we call you?</Text>
            <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
              This is how other collectors will see you
            </Text>
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={displayName}
                  onChangeText={(v) => { setDisplayName(v); setError(''); }}
                  placeholder="Your display name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  autoFocus
                  accessibilityLabel="Display name"
                />
              </View>
            </View>
            {displayName && !isValidDisplayName && (
              <Text style={[styles.errorText, { color: colors.semanticRed }]}>Must be 2-50 characters</Text>
            )}
          </>
        );

      case 'username':
        return (
          <>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Choose a username</Text>
            <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
              Lowercase letters, numbers, and underscores only
            </Text>
            <View style={styles.inputWrapper}>
              {showGlow && (
                <RNAnimated.View
                  style={[
                    styles.glowBorder,
                    { backgroundColor: getGlowColor(), opacity: glowOpacity, borderRadius: RADII.medium },
                  ]}
                />
              )}
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
                  status === 'unavailable' && { borderColor: colors.semanticRed },
                ]}
              >
                <Text style={[styles.inputPrefix, { color: colors.textTertiary }]}>@</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPrefix, { color: colors.textPrimary }]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  autoFocus
                  accessibilityLabel="Username"
                />
                {status === 'checking' && (
                  <ActivityIndicator size="small" color={colors.brandVolt} style={styles.inputSuffix} />
                )}
                {status === 'available' && (
                  <Check size={18} color={colors.semanticGreen} style={styles.inputSuffix} />
                )}
              </View>
            </View>
            {status === 'available' && (
              <Text style={[styles.successText, { color: colors.semanticGreen }]}>Username is available</Text>
            )}
            {status === 'unavailable' && (
              <Text style={[styles.errorText, { color: colors.semanticRed }]}>Username is already taken</Text>
            )}
            {status === 'invalid' && username && (
              <Text style={[styles.errorText, { color: colors.semanticRed }]}>
                3-20 chars, letters, numbers, underscore only
              </Text>
            )}
          </>
        );

      case 'email':
        return (
          <>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Your email address</Text>
            <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
              We&apos;ll use this to keep your account secure
            </Text>
            <View style={styles.inputWrapper}>
              {showGlow && (
                <RNAnimated.View
                  style={[
                    styles.glowBorder,
                    { backgroundColor: getGlowColor(), opacity: glowOpacity, borderRadius: RADII.medium },
                  ]}
                />
              )}
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
                  emailStatus === 'unavailable' && { borderColor: colors.semanticRed },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  accessibilityLabel="Email address"
                />
                {emailStatus === 'checking' && (
                  <ActivityIndicator size="small" color={colors.brandVolt} style={styles.inputSuffix} />
                )}
                {emailStatus === 'available' && (
                  <Check size={18} color={colors.semanticGreen} style={styles.inputSuffix} />
                )}
              </View>
            </View>
            {emailStatus === 'available' && (
              <Text style={[styles.successText, { color: colors.semanticGreen }]}>Email is available</Text>
            )}
            {emailStatus === 'unavailable' && (
              <Text style={[styles.errorText, { color: colors.semanticRed }]}>Email is already registered</Text>
            )}
            {emailStatus === 'invalid' && email && (
              <Text style={[styles.errorText, { color: colors.semanticRed }]}>
                Please enter a valid email address
              </Text>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // --- Render finish profile (bio + avatar) ---
  const renderFinishProfile = () => {
    return (
      <Animated.View entering={FadeIn} style={styles.viewContainer}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <VitrineLogo width={200} height={60} color={colors.textPrimary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Finish your profile</Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Add a photo and bio so other collectors can find you
          </Text>

          <TouchableOpacity
            onPress={handleAvatarPress}
            style={styles.avatarContainer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add profile photo"
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatarImage, { borderColor: colors.brandVolt }]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
                ]}
              >
                <Camera size={28} color={colors.textTertiary} />
              </View>
            )}
            {isUploadingAvatar && (
              <View style={[styles.avatarUploading, { backgroundColor: colors.scrim }]}>
                <ActivityIndicator size="small" color={colors.brandVolt} />
              </View>
            )}
            <Text style={[styles.avatarLabel, { color: colors.brandVolt }]}>
              {avatarUri ? 'Change photo' : 'Add a photo'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bioContainer}>
            <Text style={[styles.bioLabel, { color: colors.textTertiary }]}>Bio</Text>
            <View
              style={[
                styles.bioInputContainer,
                { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
              ]}
            >
              <TextInput
                style={[styles.bioInput, { color: colors.textPrimary }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other collectors about yourself..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={160}
                textAlignVertical="top"
                accessibilityLabel="Bio"
              />
            </View>
            <Text style={[styles.bioCount, { color: colors.textTertiary }]}>{bio.length}/160</Text>
          </View>

          {error ? (
            <Text style={[styles.generalError, { color: colors.semanticRed }]}>{error}</Text>
          ) : null}

          <Button
            label={isLoading ? 'Saving...' : 'Continue'}
            onPress={handleFinishProfile}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            style={styles.finishButton}
          />

          <TouchableOpacity
            onPress={handleSkipFinish}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // --- Main render ---

  if (step === 'finish-profile') {
    return (
      <KeyboardSafeScroll
        style={[styles.container, { backgroundColor: SPLASH_BG }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSpacer} />
        <View style={styles.content}>
          {renderFinishProfile()}
        </View>
      </KeyboardSafeScroll>
    );
  }

  if (!currentField) {
    return null;
  }

  return (
    <KeyboardSafeScroll
      style={[styles.container, { backgroundColor: SPLASH_BG }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
    >
      <View style={styles.headerSpacer} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn} style={styles.viewContainer}>
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                <VitrineLogo width={200} height={60} color={colors.textPrimary} />
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>Complete your profile</Text>
              <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                Just {totalFieldsRemaining} more {totalFieldsRemaining === 1 ? 'thing' : 'things'} to get started
              </Text>

              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, styles.progressDotActive, { backgroundColor: colors.brandVolt }]} />
                {Array.from({ length: totalFieldsRemaining - 1 }).map((_, index) => (
                  <View key={index} style={[styles.progressDot, { backgroundColor: colors.frostDivider }]} />
                ))}
              </View>

              <Animated.View
                key={currentField}
                entering={SlideInRight}
                exiting={SlideOutLeft}
                style={styles.fieldContainer}
              >
                {renderFieldContent()}
              </Animated.View>

              {error ? (
                <Text style={[styles.generalError, { color: colors.semanticRed }]}>{error}</Text>
              ) : null}

              <Button
                label={
                  isLoading
                    ? 'Saving...'
                    : totalFieldsRemaining === 1
                      ? 'Finish'
                      : 'Continue'
                }
                onPress={handleContinue}
                disabled={isLoading || !isCurrentFieldValid()}
                loading={isLoading}
                fullWidth
                style={styles.continueButton}
              />

              <TouchableOpacity
                onPress={logout}
                style={styles.signOutButton}
                accessibilityRole="button"
                accessibilityLabel="Use a different account"
              >
                <Text style={[styles.signOutText, { color: colors.textTertiary }]}>
                  Use a different account
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
    </KeyboardSafeScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSpacer: {
    height: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  viewContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
    flex: 1,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 24,
  },
  fieldContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldHint: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  glowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 12,
    opacity: 0.5,
  },
  inputContainer: {
    width: '100%',
    borderRadius: RADII.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputPrefix: {
    paddingLeft: 14,
    fontFamily: TYPE.inter,
    fontSize: 16,
  },
  input: {
    flex: 1,
    padding: 14,
    fontFamily: TYPE.inter,
    fontSize: 16,
  },
  inputWithPrefix: {
    paddingLeft: 4,
  },
  inputSuffix: {
    paddingRight: 12,
  },
  errorText: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  successText: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  generalError: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 32,
  },
  signOutButton: {
    marginTop: 24,
    padding: 12,
  },
  signOutText: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    textAlign: 'center',
  },
  // Finish profile styles
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  avatarUploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: TYPE.groteskMedium,
    fontSize: 12,
    marginTop: 8,
  },
  bioContainer: {
    width: '100%',
    marginBottom: 16,
  },
  bioLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bioInputContainer: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bioInput: {
    padding: 14,
    fontFamily: TYPE.inter,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
  },
  bioCount: {
    fontFamily: TYPE.inter,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  finishButton: {
    marginTop: 16,
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    textAlign: 'center',
  },
});
