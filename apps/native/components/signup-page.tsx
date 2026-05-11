import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated as RNAnimated, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { VitrineButton } from './ui/vitrine-button';
import { VitrineLogo } from './vitrine-logo';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { checkEmail } from '@/lib/api/auth';

type SignupView = 'main' | 'verify';
type EmailStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

const OTP_LENGTH = 6;

const successColor = colors.success;
const errorColor = colors.destructive;

export function SignupPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtpCode, login } = useAuth();
  const [view, setView] = useState<SignupView>('main');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailError, setEmailError] = useState('');
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const codeRefs = useRef<(TextInput | null)[]>([]);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, []);

  useEffect(() => {
    const showGlow = emailStatus === 'available' || emailStatus === 'unavailable' || emailStatus === 'invalid';
    RNAnimated.timing(glowOpacity, {
      toValue: showGlow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [emailStatus]);

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleEmailCheck = async (value: string) => {
    if (!value) {
      setEmailStatus('idle');
      setEmailError('');
      return;
    }

    if (!isValidEmail(value)) {
      setEmailStatus('invalid');
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailStatus('checking');
    setEmailError('');

    try {
      const result = await checkEmail(value);
      if (result.available) {
        setEmailStatus('available');
        setEmailError('');
      } else {
        setEmailStatus('unavailable');
        setEmailError('This email is already registered. Try signing in instead.');
      }
    } catch {
      setEmailStatus('idle');
      setEmailError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError('');
    setError('');

    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(() => handleEmailCheck(value), 500);
  };

  const handleSendCode = async () => {
    const trimmed = email.trim();

    if (!isValidEmail(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (emailStatus === 'unavailable') {
      setEmailError('This email is already registered. Try signing in instead.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await sendOtpCode(trimmed);
      setView('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, nativeEvent: { key: string }) => {
    if (nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndCreate = async () => {
    const code = verificationCode.join('');
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email.trim(), code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      await sendOtpCode(email.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
    setVerificationCode(Array(OTP_LENGTH).fill(''));
    codeRefs.current[0]?.focus();
  };

  const getMaskedEmail = (): string => {
    const trimmed = email.trim();
    const [local, domain] = trimmed.split('@');
    if (local && domain) {
      const maskedLocal = local.length > 2
        ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}${local[local.length - 1]}`
        : local;
      return `${maskedLocal}@${domain}`;
    }
    return trimmed;
  };

  const getGlowColor = (): string => {
    if (emailStatus === 'available') return successColor;
    if (emailStatus === 'unavailable' || emailStatus === 'invalid') return errorColor;
    return colors.primary;
  };

  const canSendCode = emailStatus === 'available' && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {view !== 'main' ? (
            <TouchableOpacity
              onPress={() => {
                setView('main');
                setVerificationCode(Array(OTP_LENGTH).fill(''));
                setError('');
              }}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.content}>
          {view === 'main' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewContainer}>
              <View style={styles.topSection}>
                <View style={styles.logoContainer}>
                  <VitrineLogo width={240} height={72} />
                </View>

                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Enter your email to get started</Text>

                <View style={styles.formContainer}>
                  <View style={styles.fieldWrapper}>
                    <View style={styles.inputWrapper}>
                      {(emailStatus === 'available' || emailStatus === 'unavailable' || emailStatus === 'invalid') && (
                        <RNAnimated.View
                          style={[
                            styles.glowBorder,
                            { backgroundColor: getGlowColor(), opacity: glowOpacity },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.inputContainer,
                          (emailStatus === 'unavailable' || emailStatus === 'invalid') && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={[
                            styles.input,
                            (emailStatus === 'unavailable' || emailStatus === 'invalid') && styles.inputError,
                          ]}
                          value={email}
                          onChangeText={handleEmailChange}
                          placeholder="you@example.com"
                          placeholderTextColor={colors.mutedForeground + '80'}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
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
                    {emailError ? (
                      <Text style={styles.fieldError}>{emailError}</Text>
                    ) : emailStatus === 'available' ? (
                      <Text style={styles.fieldSuccess}>Email available</Text>
                    ) : null}
                  </View>

                  {error && <Text style={styles.formError}>{error}</Text>}

                  <VitrineButton
                    variant="confirmation"
                    onPress={handleSendCode}
                    disabled={!canSendCode}
                    style={styles.button}
                  >
                    {isLoading ? 'Sending Code...' : 'Create Account'}
                  </VitrineButton>
                </View>
              </View>

              <View style={styles.bottomSection}>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  style={styles.loginButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in to existing account"
                >
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginLink}>SIGN IN</Text>
                  </Text>
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>
          )}

          {view === 'verify' && (
            <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.viewContainer}>
              <View style={styles.topSection}>
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>📧</Text>
                </View>

                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We sent a {OTP_LENGTH}-digit code to{'\n'}
                  <Text style={styles.contactText}>{getMaskedEmail()}</Text>
                </Text>

                <View style={styles.codeContainer}>
                  {verificationCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (codeRefs.current[index] = ref)}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(index, value)}
                      onKeyPress={(e) => handleKeyDown(index, e.nativeEvent)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      autoFocus={index === 0}
                      accessibilityLabel={`Verification code digit ${index + 1}`}
                    />
                  ))}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                >
                  <Text style={[styles.resendText, isLoading && styles.resendTextDisabled]}>
                    {isLoading ? 'Sending...' : 'Resend code'}
                  </Text>
                </TouchableOpacity>

                <VitrineButton
                  variant="confirmation"
                  onPress={handleVerifyAndCreate}
                  disabled={isLoading || verificationCode.join('').length !== OTP_LENGTH}
                  style={styles.button}
                >
                  {isLoading ? 'Creating Account...' : 'Verify & Create Account'}
                </VitrineButton>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
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
    justifyContent: 'space-between',
    flex: 1,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  fieldWrapper: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
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
  inputContainerError: {
    borderColor: errorColor + '80',
  },
  input: {
    flex: 1,
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
  },
  inputError: {
    color: errorColor,
  },
  inputSuffix: {
    paddingRight: 12,
  },
  fieldError: {
    fontSize: 12,
    color: errorColor,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  fieldSuccess: {
    fontSize: 12,
    color: successColor,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  formError: {
    fontSize: 12,
    color: errorColor,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  loginButton: {
    marginBottom: 24,
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 10,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: colors.foreground,
    textDecorationLine: 'underline',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 24,
  },
  contactText: {
    color: colors.foreground,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  codeInput: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 18,
    color: colors.foreground,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive,
    marginBottom: 8,
    textAlign: 'center',
  },
  resendButton: {
    marginBottom: 24,
  },
  resendText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    opacity: 0.5,
  },
});
