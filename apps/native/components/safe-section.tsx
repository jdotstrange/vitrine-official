import React, { Component, type ReactNode } from 'react';

import { logger } from '@/lib/logger';

const log = logger.create('SafeSection');

interface SafeSectionProps {
  children: ReactNode;
  /** Rendered when the wrapped subtree throws. Defaults to nothing (graceful hide). */
  fallback?: ReactNode;
  /** When this value changes, a previously-errored section is given another chance. */
  resetKey?: string | number | null;
  /** Label used in crash logs so we can tell which section failed. */
  name?: string;
}

interface SafeSectionState {
  hasError: boolean;
}

/**
 * Section-scoped error boundary. Unlike the app-root ErrorBoundary, a throw here
 * only takes down the wrapped subtree — the rest of the screen keeps rendering.
 * The error is still reported through `logger` (which forwards to Sentry), so we
 * retain visibility into failures while shielding users from a blanked screen.
 */
export class SafeSection extends Component<SafeSectionProps, SafeSectionState> {
  state: SafeSectionState = { hasError: false };

  static getDerivedStateFromError(): SafeSectionState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const label = this.props.name ? ` [${this.props.name}]` : '';
    log.error(`SafeSection${label} caught render error:`, error);
  }

  componentDidUpdate(prevProps: SafeSectionProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
