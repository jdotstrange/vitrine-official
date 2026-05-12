/**
 * Backwards-compat shim — `managed-rules` lives in `@vitrine/api` after Day 2.5.
 */
export {
  isOpValidForField,
  defaultOpForField,
  opsForField,
  validateRules,
  itemMatchesManagedRules,
  evaluateManagedRules,
  evalRowFromDbRow,
  evalRowFromCollectionItem,
  normalizeText,
  normalizeTraitToken,
  labelForField,
  labelForOp,
  formatCondition,
  formatRulesSummary,
  type RuleField,
  type RuleOp,
  type RuleMatchMode,
  type ConditionValue,
  type Condition,
  type ManagedRules,
  type EvalCollectible,
  type DbCollectibleRow,
  type ValidationResult,
} from '@vitrine/api';
