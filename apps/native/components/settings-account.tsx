import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Animated as RNAnimated,
} from 'react-native';
import { KeyboardSafeScroll } from '@/components/vault';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Check, AlertCircle, LogOut, Trash2 } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastType } from './ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { checkEmail } from '@/lib/api/auth';
import { sendEmailOtp, verifyEmailOtp, supabase } from '@/lib/supabase';

type FieldStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'same';

export function SettingsAccount() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfileStatus } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState<'input' | 'otp'>('input');
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const [fieldStatus, setFieldStatus] = useState<FieldStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const opacity = ['available', 'unavailable', 'invalid', 'same'].includes(fieldStatus) ? 1 : 0;
    RNAnimated.timing(glowOpacity, {
      toValue: opacity,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fieldStatus]);

  const showToastMessage = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const resetEditing = () => {
    setIsEditing(false);
    setEditStep('input');
    setNewEmail('');
    setOtpCode(['', '', '', '', '', '']);
    setError('');
    setFieldStatus('idle');
    setStatusMessage('');
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkEmailAvailability = async (value: string) => {
    if (!value) {
      setFieldStatus('idle');
      setStatusMessage('');
      return;
    }
    if (value.toLowerCase() === user?.email?.toLowerCase()) {
      setFieldStatus('same');
      setStatusMessage('This is your current email');
      return;
    }
    if (!validateEmail(value)) {
      setFieldStatus('invalid');
      setStatusMessage('Please enter a valid email address');
      return;
    }
    setFieldStatus('checking');
    setStatusMessage('');
    try {
      const result = await checkEmail(value);
      if (result.available) {
        setFieldStatus('available');
        setStatusMessage('Available');
      } else {
        setFieldStatus('unavailable');
        setStatusMessage('This email is already registered');
      }
    } catch {
      setFieldStatus('invalid');
      setStatusMessage('Unable to check availability');
    }
  };

  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(() => checkEmailAvailability(value), 500);
  };

  const handleSendOtp = async () => {
    if (fieldStatus !== 'available') return;
    setError('');
    setIsLoading(true);
    try {
      const result = await sendEmailOtp(newEmail);
      if (!result.success) throw new Error(result.error || 'Failed to send verification code');
      setEditStep('otp');
      setOtpCode(['', '', '', '', '', '']);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await verifyEmailOtp(newEmail, code);
      if (result.error) throw new Error(result.error);
      showToastMessage('Email updated successfully!', 'success');
      await refreshProfileStatus();
      resetEditing();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== user?.username?.toLowerCase()) return;
    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No active session');

      const { error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { confirmUsername: deleteConfirmText },
      });

      if (fnError) throw fnError;

      setShowDeleteModal(false);
      await logout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      Alert.alert('Error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getGlowColor = (): string => {
    if (fieldStatus === 'available') return colors.semanticGreen;
    if (['unavailable', 'invalid', 'same'].includes(fieldStatus)) return colors.semanticRed;
    return colors.brandVolt;
  };

  const getStatusColor = (): string => {
    if (fieldStatus === 'available') return colors.semanticGreen;
    return colors.semanticRed;
  };

  const canSendOtp = fieldStatus === 'available' && !isLoading;
  const showGlow = ['available', 'unavailable', 'invalid', 'same'].includes(fieldStatus);
  const canDelete = deleteConfirmText.toLowerCase() === (user?.username?.toLowerCase() ?? '');

  const renderEditModal = () => {
    if (!isEditing) return null;

    return (
      <View style={[s.editModal, { backgroundColor: colors.void }]}>
        <View style={[s.editModalContent, { paddingTop: insets.top + 16 }]}>
          <View style={[s.editModalHeader, { borderBottomColor: colors.frostDivider }]}>
            <TouchableOpacity onPress={resetEditing} style={s.backBtn}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[s.editModalTitle, { color: colors.textPrimary }]}>Change Email</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardSafeScroll
            style={s.editModalBody}
            contentContainerStyle={s.editModalBodyContent}
          >
            {editStep === 'input' ? (
              <>
                <View style={s.inputSection}>
                  <Text style={[s.inputLabel, { color: colors.textPrimary }]}>New Email Address</Text>
                  <View style={s.inputWrapper}>
                    {showGlow && (
                      <RNAnimated.View
                        style={[s.glowBorder, { backgroundColor: getGlowColor(), opacity: glowOpacity }]}
                      />
                    )}
                    <View
                      style={[
                        s.inputContainer,
                        { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder },
                        ['unavailable', 'invalid', 'same'].includes(fieldStatus) && s.inputContainerError,
                        fieldStatus === 'available' && s.inputContainerSuccess,
                      ]}
                    >
                      <Mail
                        size={20}
                        color={
                          fieldStatus === 'available'
                            ? colors.semanticGreen
                            : ['unavailable', 'invalid', 'same'].includes(fieldStatus)
                            ? colors.semanticRed
                            : colors.textTertiary
                        }
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={[
                          s.input,
                          { color: colors.textPrimary },
                          fieldStatus === 'available' && { color: colors.semanticGreen },
                          ['unavailable', 'invalid', 'same'].includes(fieldStatus) && { color: colors.semanticRed },
                        ]}
                        value={newEmail}
                        onChangeText={handleEmailChange}
                        placeholder="Enter new email address"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        accessibilityLabel="New email address"
                      />
                      {fieldStatus === 'checking' && <ActivityIndicator size="small" color={colors.brandVolt} />}
                      {fieldStatus === 'available' && <Check size={20} color={colors.semanticGreen} />}
                    </View>
                  </View>

                  {statusMessage ? (
                    <Text style={[s.statusText, { color: getStatusColor() }]}>{statusMessage}</Text>
                  ) : null}

                  {error ? (
                    <View style={s.errorRow}>
                      <AlertCircle size={14} color={colors.semanticRed} />
                      <Text style={[s.errorText, { color: colors.semanticRed }]}>{error}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[s.infoText, { color: colors.textSecondary }]}>
                  We'll send a verification code to confirm this email address belongs to you.
                </Text>

                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={!canSendOtp}
                  style={[s.primaryButton, { backgroundColor: colors.frostBorder }, canSendOtp && { backgroundColor: colors.brandVolt }]}
                  accessibilityRole="button"
                  accessibilityLabel="Send verification code"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={[s.primaryButtonText, { color: colors.textTertiary }, canSendOtp && { color: colors.textInverse }]}>
                      Send Verification Code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.otpSection}>
                  <Text style={[s.otpTitle, { color: colors.textPrimary }]}>Enter Verification Code</Text>
                  <Text style={[s.otpSubtitle, { color: colors.textSecondary }]}>We sent a 6-digit code to {newEmail}</Text>
                  <View style={s.otpInputContainer}>
                    {otpCode.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpInputRefs.current[index] = ref; }}
                        style={[
                          s.otpInput,
                          { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder, color: colors.textPrimary },
                          error && { borderColor: colors.semanticRed },
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(index, value)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        autoFocus={index === 0}
                        accessibilityLabel={`Verification code digit ${index + 1}`}
                      />
                    ))}
                  </View>
                  {error ? (
                    <View style={s.errorRow}>
                      <AlertCircle size={14} color={colors.semanticRed} />
                      <Text style={[s.errorText, { color: colors.semanticRed }]}>{error}</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={isLoading || otpCode.join('').length !== 6}
                  style={[s.primaryButton, { backgroundColor: colors.frostBorder }, otpCode.join('').length === 6 && { backgroundColor: colors.brandVolt }]}
                  accessibilityRole="button"
                  accessibilityLabel="Verify and save"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={[s.primaryButtonText, { color: colors.textTertiary }, otpCode.join('').length === 6 && { color: colors.textInverse }]}>
                      Verify & Save
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setEditStep('input')} style={s.linkButton}>
                  <Text style={[s.linkButtonText, { color: colors.textSecondary }]}>Use a different email</Text>
                </TouchableOpacity>
              </>
            )}
          </KeyboardSafeScroll>
        </View>
      </View>
    );
  };

  const renderDeleteModal = () => (
    <Modal visible={showDeleteModal} animationType="slide" presentationStyle="pageSheet">
      <View style={[s.deleteModal, { backgroundColor: colors.void, paddingTop: insets.top + 20 }]}>
        <View style={[s.deleteHeader, { borderBottomColor: colors.frostDivider }]}>
          <TouchableOpacity onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.deleteHeaderTitle, { color: colors.semanticRed }]}>Delete Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardSafeScroll contentContainerStyle={s.deleteBody}>
          <View style={s.deleteWarningCard}>
            <Trash2 size={24} color={colors.semanticRed} />
            <Text style={[s.deleteWarningTitle, { color: colors.semanticRed }]}>This action is permanent</Text>
            <Text style={[s.deleteWarningText, { color: colors.textSecondary }]}>
              Deleting your account will permanently remove all your collectibles, showcases, followers, and data. This cannot be undone.
            </Text>
          </View>

          <View style={s.inputSection}>
            <Text style={[s.inputLabel, { color: colors.textPrimary }]}>
              Type <Text style={[s.usernameBold, { color: colors.textPrimary }]}>@{user?.username}</Text> to confirm
            </Text>
            <TextInput
              style={[s.deleteInput, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder, color: colors.textPrimary }]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder={user?.username ?? ''}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Type your username to confirm deletion"
            />
          </View>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={!canDelete || isDeleting}
            style={[s.deleteButton, { backgroundColor: colors.frostBorder }, canDelete && !isDeleting && { backgroundColor: colors.semanticRed }]}
            accessibilityRole="button"
            accessibilityLabel="Permanently delete account"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[s.deleteButtonText, { color: colors.textTertiary }, canDelete && { color: '#fff' }]}>
                Delete My Account
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardSafeScroll>
      </View>
    </Modal>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Account</Text>
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Email section */}
        <View style={[s.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <View style={s.cardRow}>
            <View style={s.cardRowLeft}>
              <Mail size={18} color={colors.textTertiary} />
              <View>
                <Text style={[s.cardLabel, { color: colors.textPrimary }]}>Email Address</Text>
                <Text style={[s.cardValue, { color: colors.textSecondary }]}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(true)} accessibilityRole="button" accessibilityLabel="Change email">
              <Text style={[s.changeBtn, { color: colors.brandVolt }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[s.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]} onPress={handleSignOut} accessibilityRole="button" accessibilityLabel="Sign out">
          <View style={s.cardRow}>
            <View style={s.cardRowLeft}>
              <LogOut size={18} color={colors.textTertiary} />
              <Text style={[s.cardLabel, { color: colors.textPrimary }]}>Sign Out</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity
          style={[s.card, s.destructiveCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}
          onPress={() => setShowDeleteModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <View style={s.cardRow}>
            <View style={s.cardRowLeft}>
              <Trash2 size={18} color={colors.semanticRed} />
              <Text style={[s.cardLabel, { color: colors.semanticRed }]}>Delete Account</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {isEditing && renderEditModal()}
      {renderDeleteModal()}

      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />
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
    gap: 12,
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.gutter,
    gap: SPACING.zoneIntra,
  },
  card: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: SPACING.rowPadY,
  },
  destructiveCard: {
    borderColor: 'rgba(255, 32, 71, 0.25)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  cardValue: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    marginTop: 2,
  },
  changeBtn: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
  },
  editModal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  editModalContent: {
    flex: 1,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  editModalTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 18,
  },
  editModalBody: {
    flex: 1,
  },
  editModalBodyContent: {
    padding: SPACING.gutter,
    gap: SPACING.sectionGap,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
  inputWrapper: {
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: RADII.medium + 2,
    opacity: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.medium,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: 'rgba(255, 32, 71, 0.5)',
  },
  inputContainerSuccess: {
    borderColor: 'rgba(17, 255, 153, 0.5)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: TYPE.inter,
  },
  statusText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    marginTop: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  infoText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADII.small,
  },
  primaryButtonText: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 15,
  },
  otpSection: {
    alignItems: 'center',
    gap: 12,
  },
  otpTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  otpSubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    textAlign: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: RADII.small,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: TYPE.monoMedium,
  },
  linkButton: {
    alignSelf: 'center',
    padding: 8,
  },
  linkButtonText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  deleteModal: {
    flex: 1,
    paddingHorizontal: SPACING.gutter,
  },
  deleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: SPACING.sectionGap,
  },
  deleteHeaderTitle: {
    flex: 1,
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  deleteBody: {
    gap: SPACING.sectionGap,
    paddingBottom: 48,
  },
  deleteWarningCard: {
    backgroundColor: 'rgba(255, 32, 71, 0.08)',
    borderRadius: RADII.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 32, 71, 0.25)',
    padding: SPACING.gutter,
    alignItems: 'center',
    gap: 12,
  },
  deleteWarningTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 16,
  },
  deleteWarningText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  usernameBold: {
    fontFamily: TYPE.monoMedium,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: TYPE.mono,
    fontSize: 16,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADII.small,
  },
  deleteButtonText: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 15,
  },
});
