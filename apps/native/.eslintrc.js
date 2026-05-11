module.exports = {
  extends: ['expo', 'plugin:react-native-a11y/all'],
  plugins: ['react-native-a11y'],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'react-native-a11y/has-accessibility-props': 'warn',
    'react-native-a11y/has-valid-accessibility-role': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'scripts/'],
};
