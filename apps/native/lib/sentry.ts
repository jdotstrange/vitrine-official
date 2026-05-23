import * as Sentry from '@sentry/react-native';
import { registerSentryHandlers } from './logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.debug('[Sentry] No DSN configured — crash reporting disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    sendDefaultPii: true,
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });

  registerSentryHandlers({
    captureException: (error: unknown) => Sentry.captureException(error),
    addBreadcrumb: (message: string, level: string) =>
      Sentry.addBreadcrumb({ message, level }),
  });
}

export { Sentry };
