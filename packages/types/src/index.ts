/**
 * @vitrine/types — shared domain types.
 *
 * Source of truth for cross-platform TypeScript types. No runtime values,
 * no React, no Supabase client, no platform-specific imports — purely
 * `interface` and `type` declarations that compile to nothing at runtime.
 *
 * Scope:
 *   - User profile shape
 *   - Collectible primitives (ListingStatus, CollectibleType)
 *   - Activity journal entries
 *   - Managed Showcase rule grammar
 *   - Generated Supabase Database type (currently stubbed)
 *
 * Larger collectible/showcase response shapes live in their respective
 * API modules until those modules move into `@vitrine/api` (Day 2.5).
 * Then they will reorganize here so consumers stop reaching into API
 * package internals for types.
 */

export type {
  User,
  ProfileStatus,
} from './domain/user';

export type {
  ListingStatus,
  CollectibleType,
} from './domain/collectible';

export type {
  JournalVerb,
  JournalEntry,
  GetJournalOptions,
} from './domain/activity';

export type {
  RuleField,
  RuleOp,
  RuleMatchMode,
  ConditionValue,
  Condition,
  ManagedRules,
  EvalCollectible,
} from './domain/managed-rules';

export type {
  Database,
  Tables,
  Inserts,
  Updates,
} from './database';
