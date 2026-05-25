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
}

const log = logger.create('ErrorBoundary');

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('Uncaught error:', error, errorInfo.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.brand}>VITRINE</Text>
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleRestart}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
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
