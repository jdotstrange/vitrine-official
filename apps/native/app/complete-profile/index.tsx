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
import { KeyboardSafeScroll } from '@/components/vault';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { VitrineButton } from '@/components/ui/vitrine-button';
import { VitrineLogo } from '@/components/vitrine-logo';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { checkUsername, checkEmail, uploadAvatar } from '@/lib/api/auth';

type FieldStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

const successColor = colors.success;
const errorColor = colors.destructive;

type MissingField = 'displayName' | 'username' | 'email';
type CompleteProfileStep = 'required-fields' | 'finish-profile';

export default function CompleteProfilePage() {
  const insets = useSafeAreaInsets();
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
    if (status === 'available') return successColor;
    if (status === 'unavailable' || status === 'invalid') return errorColor;
    return colors.primary;
  };

  // --- Render required field content ---
  const renderFieldContent = () => {
    const status = getCurrentFieldStatus();
    const showGlow = status === 'available' || status === 'unavailable' || status === 'invalid';

    switch (currentField) {
      case 'displayName':
        return (
          <>
            <Text style={styles.fieldLabel}>What should we call you?</Text>
            <Text style={styles.fieldHint}>This is how other collectors will see you</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={(v) => { setDisplayName(v); setError(''); }}
                  placeholder="Your display name"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  autoFocus
                  accessibilityLabel="Display name"
                />
              </View>
            </View>
            {displayName && !isValidDisplayName && (
              <Text style={styles.errorText}>Must be 2-50 characters</Text>
            )}
          </>
        );

      case 'username':
        return (
          <>
            <Text style={styles.fieldLabel}>Choose a username</Text>
            <Text style={styles.fieldHint}>Lowercase letters, numbers, and underscores only</Text>
            <View style={styles.inputWrapper}>
              {showGlow && (
                <RNAnimated.View
                  style={[styles.glowBorder, { backgroundColor: getGlowColor(), opacity: glowOpacity }]}
                />
              )}
              <View style={[styles.inputContainer, status === 'unavailable' && styles.inputError]}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPrefix]}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="username"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  autoFocus
                  accessibilityLabel="Username"
                />
                {status === 'checking' && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.inputSuffix} />
                )}
                {status === 'available' && (
                  <Check size={18} color={successColor} style={styles.inputSuffix} />
                )}
              </View>
            </View>
            {status === 'available' && <Text style={styles.successText}>Username is available</Text>}
            {status === 'unavailable' && <Text style={styles.errorText}>Username is already taken</Text>}
            {status === 'invalid' && username && (
              <Text style={styles.errorText}>3-20 chars, letters, numbers, underscore only</Text>
            )}
          </>
        );

      case 'email':
        return (
          <>
            <Text style={styles.fieldLabel}>Your email address</Text>
            <Text style={styles.fieldHint}>We'll use this to keep your account secure</Text>
            <View style={styles.inputWrapper}>
              {showGlow && (
                <RNAnimated.View
                  style={[styles.glowBorder, { backgroundColor: getGlowColor(), opacity: glowOpacity }]}
                />
              )}
              <View style={[styles.inputContainer, emailStatus === 'unavailable' && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  accessibilityLabel="Email address"
                />
                {emailStatus === 'checking' && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.inputSuffix} />
                )}
                {emailStatus === 'available' && (
                  <Check size={18} color={successColor} style={styles.inputSuffix} />
                )}
              </View>
            </View>
            {emailStatus === 'available' && <Text style={styles.successText}>Email is available</Text>}
            {emailStatus === 'unavailable' && <Text style={styles.errorText}>Email is already registered</Text>}
            {emailStatus === 'invalid' && email && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
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
            <VitrineLogo width={200} height={60} />
          </View>

          <Text style={styles.title}>Finish Your Profile</Text>
          <Text style={styles.subtitleText}>Add a photo and bio so other collectors can find you</Text>

          {/* Avatar */}
          <TouchableOpacity
            onPress={handleAvatarPress}
            style={styles.avatarContainer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add profile photo"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={28} color={colors.mutedForeground} />
              </View>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarUploading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            <Text style={styles.avatarLabel}>
              {avatarUri ? 'Change photo' : 'Add a photo'}
            </Text>
          </TouchableOpacity>

          {/* Bio */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioLabel}>Bio</Text>
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other collectors about yourself..."
                placeholderTextColor={colors.mutedForeground + '80'}
                multiline
                maxLength={160}
                textAlignVertical="top"
                accessibilityLabel="Bio"
              />
            </View>
            <Text style={styles.bioCount}>{bio.length}/160</Text>
          </View>

          {error && <Text style={styles.generalError}>{error}</Text>}

          <VitrineButton
            variant="confirmation"
            onPress={handleFinishProfile}
            disabled={isLoading}
            style={styles.finishButton}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </VitrineButton>

          <TouchableOpacity
            onPress={handleSkipFinish}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // --- Main render ---

  if (step === 'finish-profile') {
    return (
      <KeyboardSafeScroll
        style={styles.container}
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
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
    >
      <View style={styles.headerSpacer} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn} style={styles.viewContainer}>
            <View style={styles.topSection}>
              <View style={styles.logoContainer}>
                <VitrineLogo width={200} height={60} />
              </View>

              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitleText}>
                Just {totalFieldsRemaining} more {totalFieldsRemaining === 1 ? 'thing' : 'things'} to get started
              </Text>

              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                {Array.from({ length: totalFieldsRemaining - 1 }).map((_, index) => (
                  <View key={index} style={styles.progressDot} />
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

              {error && <Text style={styles.generalError}>{error}</Text>}

              <VitrineButton
                variant="confirmation"
                onPress={handleContinue}
                disabled={isLoading || !isCurrentFieldValid()}
                style={styles.continueButton}
              >
                {isLoading
                  ? 'Saving...'
                  : totalFieldsRemaining === 1
                  ? 'Finish'
                  : 'Continue'}
              </VitrineButton>

              <TouchableOpacity
                onPress={logout}
                style={styles.signOutButton}
                accessibilityRole="button"
                accessibilityLabel="Use a different account"
              >
                <Text style={styles.signOutText}>Use a different account</Text>
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
    backgroundColor: colors.background,
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
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
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
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  fieldContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldHint: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 24,
    textAlign: 'center',
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
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: colors.destructive + '80',
  },
  inputPrefix: {
    paddingLeft: 12,
    color: colors.mutedForeground,
    fontSize: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
  },
  inputWithPrefix: {
    paddingLeft: 4,
  },
  inputSuffix: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive,
    marginTop: 4,
    textAlign: 'center',
  },
  successText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    textAlign: 'center',
  },
  generalError: {
    fontSize: 12,
    color: colors.destructive,
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
    fontSize: 12,
    color: colors.mutedForeground,
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
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.primary + '4D',
  },
  avatarUploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
  },
  bioContainer: {
    width: '100%',
    marginBottom: 16,
  },
  bioLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bioInputContainer: {
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bioInput: {
    padding: 12,
    color: colors.foreground,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
  },
  bioCount: {
    fontSize: 10,
    color: colors.mutedForeground,
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
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
