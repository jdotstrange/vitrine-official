type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  tag?: string;
}

let sentryCapture: ((error: unknown) => void) | null = null;
let sentryBreadcrumb: ((message: string, level: string) => void) | null = null;

/**
 * Register Sentry handlers so the logger can forward errors
 * and breadcrumbs without a direct dependency on the Sentry SDK.
 */
export function registerSentryHandlers(handlers: {
  captureException: (error: unknown) => void;
  addBreadcrumb: (message: string, level: string) => void;
}) {
  sentryCapture = handlers.captureException;
  sentryBreadcrumb = handlers.addBreadcrumb;
}

function createLogger(defaultTag?: string) {
  const format = (tag: string | undefined, args: unknown[]): unknown[] => {
    const prefix = tag ? `[${tag}]` : '';
    if (prefix && typeof args[0] === 'string') {
      return [`${prefix} ${args[0]}`, ...args.slice(1)];
    }
    return prefix ? [prefix, ...args] : args;
  };

  const log = (level: LogLevel, tag: string | undefined, args: unknown[]) => {
    if (__DEV__) {
      const formatted = format(tag, args);
      switch (level) {
        case 'debug':
          console.debug(...formatted);
          break;
        case 'info':
          console.info(...formatted);
          break;
        case 'warn':
          console.warn(...formatted);
          break;
        case 'error':
          console.error(...formatted);
          break;
      }
    }

    if (sentryBreadcrumb && level !== 'debug') {
      const message = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      sentryBreadcrumb(tag ? `[${tag}] ${message}` : message, level);
    }

    if (sentryCapture && level === 'error') {
      const errorArg = args.find((a) => a instanceof Error);
      if (errorArg) {
        sentryCapture(errorArg);
      }
    }
  };

  return {
    debug: (...args: unknown[]) => log('debug', defaultTag, args),
    info: (...args: unknown[]) => log('info', defaultTag, args),
    warn: (...args: unknown[]) => log('warn', defaultTag, args),
    error: (...args: unknown[]) => log('error', defaultTag, args),

    /**
     * Create a child logger with a specific tag prefix.
     * Usage: `const log = logger.create('Auth');`
     */
    create: (tag: string) => createLogger(tag),
  };
}

export const logger = createLogger();
