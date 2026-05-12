/**
 * Logger contract for @vitrine/api modules.
 *
 * The package itself doesn't depend on Sentry, expo, or any platform
 * logger implementation — consumers inject one. Native passes its
 * sentry-aware logger from `apps/native/lib/logger.ts`. Web RSC passes
 * a console-shaped logger (or omits and gets the no-op default).
 *
 * Shape mirrors the native logger so existing call sites
 * (`log.warn('rpc failed:', err)`) port over byte-identically.
 */

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  create: (tag: string) => Logger;
}

/**
 * No-op logger. Returned when consumers don't pass one. All methods
 * are silent so the package is safe to use in production-bound code
 * paths (Edge functions, web SSR) without spamming console output.
 */
export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  create: () => noopLogger,
};

/**
 * Console-backed logger with optional tag prefix. Useful default for
 * web environments that just want noisy debugging during dev.
 */
export function createConsoleLogger(tag?: string): Logger {
  const prefix = tag ? `[${tag}]` : '';
  const fmt = (args: unknown[]): unknown[] =>
    prefix && typeof args[0] === 'string'
      ? [`${prefix} ${args[0]}`, ...args.slice(1)]
      : prefix
        ? [prefix, ...args]
        : args;

  return {
    debug: (...args) => console.debug(...fmt(args)),
    info: (...args) => console.info(...fmt(args)),
    warn: (...args) => console.warn(...fmt(args)),
    error: (...args) => console.error(...fmt(args)),
    create: (childTag: string) => createConsoleLogger(childTag),
  };
}
