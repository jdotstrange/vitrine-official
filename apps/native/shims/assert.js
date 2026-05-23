/**
 * Minimal assert shim for React Native / Metro.
 *
 * expo-notifications → @ide/backoff → assert triggers a crash because
 * the npm `assert` polyfill lacks `types.isPromise`. This shim provides
 * just enough of the Node assert API to keep the chain working.
 */

function assert(value, message) {
  if (!value) {
    throw new Error(message || 'Assertion failed');
  }
}

assert.ok = assert;

assert.strictEqual = function (actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
};

assert.types = {
  isPromise: function (value) {
    return value instanceof Promise ||
      (value != null && typeof value.then === 'function' && typeof value.catch === 'function');
  },
};

module.exports = assert;
