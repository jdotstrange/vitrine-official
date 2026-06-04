import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { KeyboardSafeScroll, Button } from '@/components/vault';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { RADII, TYPE, useTheme } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { SPLASH_BG } from '@/lib/splash-contain-layout';

type AuthView = 'email' | 'verify';

const OTP_LENGTH = 6;
const AUTH_MARK_SIZE = 90;
/** Reference-scale hero ring + envelope on the OTP screen. */
const VERIFY_ICON_RING = 100;
const VERIFY_ICON_BORDER = 3;
const VERIFY_ENVELOPE_SIZE = 56;

/**
 * Unified passwordless auth — email → OTP. Creates or signs in via Supabase
 * (`shouldCreateUser: true`). Post-auth routing is handled by AuthProvider.
 */
export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { sendOtpCode, login } = useAuth();
  const [view, setView] = useState<AuthView>('email');
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const codeInputRef = useRef<RNTextInput>(null);
  const verifyInFlight = useRef(false);

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const submitOtp = useCallback(
    async (code: string) => {
      if (code.length !== OTP_LENGTH || verifyInFlight.current) return;

      verifyInFlight.current = true;
      setIsLoading(true);
      setError('');

      try {
        await login(email.trim(), code);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
        verifyInFlight.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [email, login],
  );

  useEffect(() => {
    if (view !== 'verify') return;
    const timer = setTimeout(() => codeInputRef.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, [view]);

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
      setOtpCode('');
      verifyInFlight.current = false;
      setView('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpCode(digits);
    setError('');

    if (digits.length === OTP_LENGTH) {
      void submitOtp(digits);
    } else {
      verifyInFlight.current = false;
    }
  };

  const handleVerify = () => {
    void submitOtp(otpCode);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    verifyInFlight.current = false;
    try {
      await sendOtpCode(email.trim());
      setOtpCode('');
      codeInputRef.current?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setView('email');
    setOtpCode('');
    setError('');
    verifyInFlight.current = false;
  };

  const isOtpComplete = otpCode.length === OTP_LENGTH;

  if (view === 'verify') {
    return (
      <View style={[styles.container, { backgroundColor: SPLASH_BG }]}>
        <View style={[styles.verifyRoot, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={goBackToEmail}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.brandVolt} />
            </TouchableOpacity>
          </View>

          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={styles.verifyScreen}
          >
            {/*
              Keyboard avoidance applies only above the footer — the code field
              scrolls into view when focused; Resend/Continue stay pinned to the
              bottom of the screen (may sit under the keyboard while typing).
            */}
            <KeyboardAwareScrollView
              style={styles.verifyKeyboardArea}
              contentContainerStyle={styles.verifyKeyboardContent}
              bottomOffset={12}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.iconRing,
                  {
                    borderColor: colors.brandVolt,
                    backgroundColor: SPLASH_BG,
                    borderWidth: VERIFY_ICON_BORDER,
                  },
                ]}
              >
                <Mail size={VERIFY_ENVELOPE_SIZE} color={colors.brandVolt} strokeWidth={1.5} />
              </View>

              <Text style={[styles.verifyHeadline, { color: colors.brandVolt }]}>Check Your Email</Text>
              <Text style={[styles.verifyBody, { color: colors.brandVolt }]}>
                Check your inbox and enter the 6-digit sign in code.
              </Text>

              <View style={styles.codeField}>
                <Text
                  style={[
                    styles.codeLabel,
                    { color: isCodeFocused || otpCode ? colors.brandVolt : colors.textTertiary },
                  ]}
                >
                  Code
                </Text>
                <TextInput
                  ref={codeInputRef}
                  style={[
                    styles.codeInput,
                    {
                      color: colors.brandVolt,
                      borderBottomColor: isCodeFocused ? colors.brandVolt : colors.frostDivider,
                    },
                  ]}
                  value={otpCode}
                  onChangeText={handleOtpChange}
                  onFocus={() => setIsCodeFocused(true)}
                  onBlur={() => setIsCodeFocused(false)}
                  placeholder=""
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                  importantForAutofill="yes"
                  autoCorrect={false}
                  maxLength={OTP_LENGTH}
                  cursorColor={colors.brandVolt}
                  selectionColor={colors.brandVoltFill}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                  accessibilityLabel="Verification code"
                />
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: colors.semanticRed }]}>{error}</Text>
              ) : null}
            </KeyboardAwareScrollView>

            <View style={[styles.verifyActions, { paddingBottom: insets.bottom + 12 }]}>
              <Button
                label={isLoading ? 'Sending...' : 'Resend code'}
                onPress={handleResendCode}
                disabled={isLoading}
                variant="frost"
                fullWidth
                style={styles.actionButton}
              />
              <Button
                label={isLoading ? 'Verifying...' : 'Continue'}
                onPress={handleVerify}
                disabled={isLoading || !isOtpComplete}
                loading={isLoading}
                fullWidth
                style={[styles.actionButton, { backgroundColor: colors.brandVolt }]}
              />
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardSafeScroll
      style={[styles.container, { backgroundColor: SPLASH_BG }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {view === 'email' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.emailScreen}>
            <View style={styles.emailMain}>
              <Image
                source={require('../assets/adaptive-icon.png')}
                style={styles.markImage}
                resizeMode="contain"
                accessibilityLabel="Vitrine"
              />

              <Text style={[styles.headline, { color: colors.brandVolt }]}>
                What&apos;s your email?
              </Text>
              <Text style={[styles.body, { color: colors.brandVolt }]}>
                We&apos;ll send you a one-time sign-in code so you don&apos;t need to remember a
                password.
              </Text>

              <TextInput
                style={[
                  styles.emailInput,
                  {
                    color: colors.brandVolt,
                    borderBottomColor: isEmailFocused ? colors.brandVolt : colors.frostDivider,
                  },
                ]}
                cursorColor={colors.brandVolt}
                selectionColor={colors.brandVoltFill}
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                placeholder=""
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={100}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
                accessibilityLabel="Email address"
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.semanticRed }]}>{error}</Text>
              ) : null}

              <Button
                label={isLoading ? 'Sending code...' : 'Continue'}
                onPress={handleSendCode}
                disabled={isLoading || !isValidEmail(email)}
                loading={isLoading}
                fullWidth
                style={[styles.primaryButton, { backgroundColor: colors.brandVolt }]}
              />
            </View>

            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing, you agree to our{' '}
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        )}
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
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
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
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  emailScreen: {
    flex: 1,
    minHeight: 520,
    justifyContent: 'space-between',
  },
  emailMain: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  markImage: {
    width: AUTH_MARK_SIZE,
    height: AUTH_MARK_SIZE,
    marginBottom: 32,
  },
  headline: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  body: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  emailInput: {
    width: '100%',
    fontFamily: TYPE.groteskMedium,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    paddingVertical: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  primaryButton: {
    marginTop: 28,
    minHeight: 52,
    borderRadius: RADII.pill,
  },
  termsText: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  verifyRoot: {
    flex: 1,
    paddingHorizontal: 28,
  },
  verifyScreen: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  verifyKeyboardArea: {
    flex: 1,
  },
  verifyKeyboardContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  iconRing: {
    width: VERIFY_ICON_RING,
    height: VERIFY_ICON_RING,
    borderRadius: VERIFY_ICON_RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  verifyHeadline: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  verifyBody: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  codeField: {
    width: '100%',
    marginBottom: 4,
  },
  codeLabel: {
    fontFamily: TYPE.groteskMedium,
    fontSize: 13,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  codeInput: {
    width: '100%',
    fontFamily: TYPE.groteskMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  errorText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  verifyActions: {
    width: '100%',
    gap: 10,
    flexShrink: 0,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: RADII.pill,
  },
});
