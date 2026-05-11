import { logger } from '../../lib/logger';

describe('logger', () => {
  it('exposes debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('creates tagged child loggers', () => {
    const authLogger = logger.create('Auth');
    expect(typeof authLogger.debug).toBe('function');
    expect(typeof authLogger.info).toBe('function');
    expect(typeof authLogger.warn).toBe('function');
    expect(typeof authLogger.error).toBe('function');
  });

  it('does not throw when called', () => {
    expect(() => logger.info('test message')).not.toThrow();
    expect(() => logger.error('test error', new Error('boom'))).not.toThrow();
  });
});
