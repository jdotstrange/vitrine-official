import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DARK_COLORS } from '@vitrine/design-tokens';
import { logger } from '@/lib/logger';

// ErrorBoundary uses DARK_COLORS statically (not useTheme) because:
// 1. Class components can't call hooks
// 2. The error itself may have come from inside ThemeProvider — safer to
//    paint with a known palette than to depend on context that just crashed
const colors = DARK_COLORS;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  /** Consecutive Try Again attempts without a successful remount. */
  retryCount: number;
}

const log = logger.create('ErrorBoundary');

/** After this many failed remounts, stop remounting — avoids skeleton→error loops. */
const MAX_RETRIES = 2;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('Uncaught error:', error, errorInfo.componentStack);
  }

  handleRestart = () => {
    const { retryCount } = this.state;
    if (retryCount >= MAX_RETRIES) {
      log.warn('Try Again suppressed after repeated failures — staying on error screen');
      return;
    }
    // Remount children in place. Do NOT router.replace('/') here: for render
    // crashes that remounts the same tree (boot → tabs → crash) and turns a
    // single failure into an indefinite skeleton → Try Again loop.
    this.setState({ hasError: false, error: null, retryCount: retryCount + 1 });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const exhausted = this.state.retryCount >= MAX_RETRIES;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.brand}>VITRINE</Text>
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              {exhausted
                ? 'The app hit a repeated error. Fully close Vitrine and reopen it. If this keeps happening, contact support.'
                : 'The app encountered an unexpected error. Please try again.'}
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            {!exhausted && (
              <TouchableOpacity
                style={styles.button}
                onPress={this.handleRestart}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandVolt,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: colors.sheetBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    width: '100%',
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.semanticRed,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
