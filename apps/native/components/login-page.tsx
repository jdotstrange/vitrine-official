import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated as RNAnimated } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { VitrineButton } from './ui/vitrine-button';
import { VitrineLogo } from './vitrine-logo';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';

type AuthView = 'main' | 'verify';

const OTP_LENGTH = 6;

export function LoginPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtpCode, login } = useAuth();
  const [view, setView] = useState<AuthView>('main');
  const [email, setEmail] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const codeRefs = useRef<(TextInput | null)[]>([]);
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(glowOpacity, {
      toValue: isInputFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused]);

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError('');
  };

  const handleSendCode = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address');
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

  const handleVerify = async () => {
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

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
      keyboardShouldPersistTaps="handled"
    >
        <View style={styles.header}>
          {view !== 'main' && (
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
          )}
        </View>

        <View style={styles.content}>
          {view === 'main' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewContainer}>
              <View style={styles.topSection}>
                <View style={styles.logoContainer}>
                  <VitrineLogo width={240} height={72} />
                </View>

                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your email to sign in</Text>

                <View style={styles.formContainer}>
                  <View style={styles.inputWrapper}>
                    <RNAnimated.View
                      style={[
                        styles.glowBorder,
                        { opacity: glowOpacity },
                      ]}
                    />

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={handleEmailChange}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.mutedForeground + '80'}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={100}
                        accessibilityLabel="Email address"
                      />
                    </View>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                  </View>

                  <VitrineButton
                    variant="confirmation"
                    onPress={handleSendCode}
                    disabled={isLoading || !isValidEmail(email)}
                    style={styles.button}
                  >
                    {isLoading ? 'Sending Code...' : 'Sign In'}
                  </VitrineButton>
                </View>
              </View>

              <View style={styles.bottomSection}>
                <TouchableOpacity
                  onPress={() => router.push('/signup')}
                  style={styles.createAccountButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Create an account"
                >
                  <Text style={styles.createAccountText}>
                    New to Vitrine? <Text style={styles.createAccountLink}>CREATE AN ACCOUNT</Text>
                  </Text>
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  By continuing, you agree to our{' '}
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

                <Text style={styles.title}>Enter Verification Code</Text>
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
                  onPress={handleVerify}
                  disabled={isLoading || verificationCode.join('').length !== OTP_LENGTH}
                  style={styles.button}
                >
                  {isLoading ? 'Verifying...' : 'Sign In'}
                </VitrineButton>
              </View>
            </Animated.View>
          )}
        </View>
    </KeyboardAwareScrollView>
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
  subtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 24,
  },
  glowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 12,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  inputContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  createAccountButton: {
    marginBottom: 24,
    paddingVertical: 12,
  },
  createAccountText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  createAccountLink: {
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
    marginTop: 12,
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
    borderRadius: 10,
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
    marginTop: 8,
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
