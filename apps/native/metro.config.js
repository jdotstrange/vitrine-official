// Learn more https://docs.expo.dev/guides/monorepos/
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const projectRoot = __dirname;
// Resolve monorepo root from apps/native/ → ../../
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(projectRoot);

// 1. Watch the entire monorepo so Metro picks up changes in shared packages.
config.watchFolders = [workspaceRoot];

// 2. Tell Metro where to look for packages.
//    Order matters: app-local first, then workspace-root (hoisted).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. With pnpm hoisted layout we don't need hierarchical lookup outside
//    these two paths.
config.resolver.disableHierarchicalLookup = true;

// 4. Path alias for @ → apps/native/ (preserves existing native imports).
config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  '@': projectRoot,
};

// 5. Stub out modules that reference Node stdlib APIs unavailable in Hermes.
//    - @supabase/functions-js: uses Node APIs incompatible with RN (v1 workaround).
//    - fs (when required by third-party): e.g. `mime` (pulled in by
//      stream-chat-expo's getPhotos.ts) calls require('fs') at init time.
//    - assert: expo-notifications → @ide/backoff → assert. The npm `assert`
//      polyfill lacks `types.isPromise`, crashing Metro. Our shim provides it.
const EMPTY_MODULES = new Set([
  '@supabase/functions-js',
  'fs',
]);
const SHIM_MODULES = {
  assert: path.resolve(projectRoot, 'shims', 'assert.js'),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (EMPTY_MODULES.has(moduleName)) {
    return { type: 'empty' };
  }
  if (SHIM_MODULES[moduleName]) {
    return { type: 'sourceFile', filePath: SHIM_MODULES[moduleName] };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
