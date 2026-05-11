// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// Resolve monorepo root from apps/native/ → ../../
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

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

// 5. Skip @supabase/functions-js for React Native (Hermes-incompatible).
//    Workaround retained from v1.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/functions-js') {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
