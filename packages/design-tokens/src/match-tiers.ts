/**
 * Comps match-percentage tiering.
 *
 * Maps the 0–100 match score that the (future) universal comps algorithm
 * emits onto three UI bands with corresponding colors. The thresholds
 * below are the UI-side half of the contract — the algorithm emits
 * matchPct values calibrated to cluster cleanly into these bands.
 *
 * Contract:
 *   perfect  ≥ 90  → green   — "drop-in equivalent" match
 *   strong   70–89 → blue    — "strong comparable" match
 *   loose    < 70  → neutral — "loose signal / tiebreaker" match
 *
 * See: docs/COMPS_ALGORITHM_SPEC.md — "UI Tier Contract"
 */

import { COLORS } from './tokens';

export type MatchTier = 'perfect' | 'strong' | 'loose';

export type MatchTierResult = {
  tier: MatchTier;
  color: string;
};

export function getMatchTier(pct: number): MatchTierResult {
  if (pct >= 90) return { tier: 'perfect', color: COLORS.semanticGreen };
  if (pct >= 70) return { tier: 'strong', color: COLORS.semanticBlue };
  return { tier: 'loose', color: COLORS.textPrimary };
}

// Thresholds exposed for consumers that need to reason about the bands
// (e.g. the Foundation gallery rendering tier legends, or analytics).
export const MATCH_TIER_THRESHOLDS = {
  perfect: 90,
  strong: 70,
} as const;
