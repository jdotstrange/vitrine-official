/**
 * Sentry crash reporting scaffold.
 *
 * To activate:
 * 1. Create a Sentry account and project at https://sentry.io
 * 2. Add your DSN to .env as EXPO_PUBLIC_SENTRY_DSN
 * 3. Install the SDK: npx expo install @sentry/react-native
 * 4. Add "@sentry/react-native/expo" to plugins in app.json
 *
 * Until the DSN is configured, this module is a no-op.
 */

import { registerSentryHandlers } from './logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.debug('[Sentry] No DSN configured — crash reporting disabled.');
    }
    return;
  }

  try {
    const Sentry = require('@sentry/react-native');

    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      enableAutoSessionTracking: true,
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    });

    registerSentryHandlers({
      captureException: (error: unknown) => Sentry.captureException(error),
      addBreadcrumb: (message: string, level: string) =>
        Sentry.addBreadcrumb({ message, level }),
    });
  } catch {
    if (__DEV__) {
      console.debug('[Sentry] SDK not installed — run: npx expo install @sentry/react-native');
    }
  }
}
