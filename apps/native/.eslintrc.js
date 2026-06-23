// ---------------------------------------------------------------------------
// Legacy "White Cube" palette allow-list.
//
// The V3 design system lives in `@vitrine/design-tokens` and the per-surface
// hook `useTheme()` exported from `@/lib/design`. The legacy palette at
// `@/lib/colors` MUST NOT bleed into V3 surfaces — it's hardcoded hex, not
// theme-aware, and inverts several iOS conventions (see prior audit).
//
// Imports of `@/lib/colors` are banned globally, with an override below for
// directories that are still on the legacy palette and have not yet received
// a V3 redesign pass. When a legacy file is V3-migrated, REMOVE its entry
// from this list — that's how we apply pressure to finish the migration.
// ---------------------------------------------------------------------------
const LEGACY_COLOR_CONSUMERS = [
  // Legacy directories — entire trees still on the White Cube palette
  'components/community/**',
  'components/groups/**',
  'components/messaging/**',
  'components/upload/**',
  'components/skeletons/**',
  'components/profile/**',
  'app/community/**',
  'app/upload/bulk/**',
  'app/upload/collectible/edit/**',
  'app/messages/new/**',
  'app/tracking/[category].tsx',
  'app/tracking/index.tsx',
  'app/complete-profile/**',
  'app/(tabs)/community.tsx',
  'app/upload-trading-cards.tsx',
  'app/+not-found.tsx',
  'app/[...unmatched].tsx',
  'app/index.tsx',

  // Legacy single-file components in components/ root
  'components/auth-screen.tsx',
  'components/nav-menu.tsx',
  'components/vitrine-logo.tsx',
  'components/vitrine-boot-sequence.tsx',
  'components/community-hub.tsx',
  'components/discovery-feed.tsx',
  'components/live-ticker.tsx',
  'components/tracking.tsx',
  'components/pill-tabs.tsx',
  'components/showcase-orb.tsx',
  'components/edit-info-modal.tsx',
  'components/edit-showcase-form.tsx',
  'components/search-bar.tsx',
  'components/trading-card-detail.tsx',
  'components/trading-card-search.tsx',
  'components/trading-card-success.tsx',
  'components/trading-card-grade-select.tsx',
  'components/trading-card-details-form.tsx',
  'components/create-group.tsx',
  'components/group-info.tsx',
  'components/conversation-thread.tsx',
  'components/adaptive-image.tsx',
  'components/spatial-card.tsx',
  'components/pricing-mode-selector.tsx',
  'components/settings-export.tsx',
  'components/skeleton/**',
  'components/settings-support.tsx', // legacy palette wrapper; needs dedicated V3 pass
  'components/settings-bug-report.tsx', // legacy palette wrapper; needs dedicated V3 pass

  // Legacy subtree of components/detail/ (lenses/ and framed-hero are V3)
  'components/detail/identity-strip.tsx',
  'components/detail/action-rail.tsx',
  'components/detail/dynamic-details-section.tsx',
  'components/detail/value-action-bar.tsx',
  'components/detail/inset-grouped-list.tsx',
  'components/detail/comp-card.tsx',
  'components/detail/comps-skeleton.tsx',
  'components/detail/detail-coverage-sheet.tsx',
  'components/detail/detail-coverage-card.tsx',
  'components/detail/detail-top-controls.tsx',
  'components/detail/detail-footer.tsx',
  'components/detail/edit-pricing-modal.tsx',
  'components/detail/enrich-card.tsx',
  'components/detail/image-slider.tsx',
  'components/detail/jsonb-rows.tsx',
  'components/detail/story-section.tsx',
  'components/detail/title-card.tsx',
  'components/detail/trading-card-facts.tsx',
  'components/detail/trading-card-facts-sheet.tsx',
  'components/detail/trading-card-pricing-card.tsx',

  // Legacy UI primitives — still consumed by legacy surfaces above
  'components/ui/vitrine-button.tsx',
  'components/ui/user-avatar.tsx',
  'components/ui/showcase-picker-modal.tsx',
  'components/ui/underline-tabs.tsx',
  'components/ui/collectible-view-selector.tsx',
  'components/ui/bottom-sheet-picker.tsx',

  // Library files still on legacy palette (type re-exports / theme adapters)
  'lib/stream-theme.ts',
  'lib/status-utils.ts',
  'lib/colors.ts', // the source file itself
];

const noLegacyColorsRule = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@/lib/colors',
          message:
            'Do not import the legacy "White Cube" palette. Use `useTheme()` from `@/lib/design` for theme-aware V3 colors, or `DARK_COLORS` / `LIGHT_COLORS` from `@vitrine/design-tokens` for surfaces that must opt out of theming (image overlays, status pills).',
        },
      ],
    },
  ],
};

module.exports = {
  extends: ['expo', 'plugin:react-native-a11y/all'],
  plugins: ['react-native-a11y'],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'react-native-a11y/has-accessibility-props': 'warn',
    'react-native-a11y/has-valid-accessibility-role': 'warn',
    ...noLegacyColorsRule,
  },
  overrides: [
    {
      // Legacy surfaces keep their existing `@/lib/colors` imports until a
      // dedicated V3 redesign pass. Listed explicitly so a missing entry
      // becomes a CI failure — that's the migration pressure mechanism.
      files: LEGACY_COLOR_CONSUMERS,
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'scripts/'],
};
