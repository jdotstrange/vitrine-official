/**
 * V3 NETWORK lens primitives — barrel export.
 *
 * Three row variants + a privacy empty-state cover the entire surface:
 *   - SuggestedRow      — Suggested chip (avatar + reason chip + 3-up preview)
 *   - MutualRow         — Mutual chip   (compact ConnectionRow w/ "Followed by you")
 *   - ConnectionRow     — Followers / Following chip (compact)
 *   - PrivateListState  — visitor-facing privacy empty-state
 *
 * Lens chrome (chips, lazy load, refresh) lives in
 * `components/profile-lenses/network-lens.tsx`.
 */

export { ConnectionRow } from './connection-row';
export type { ConnectionRowProps, ConnectionRowUser } from './connection-row';

export { MutualRow } from './mutual-row';
export type { MutualRowProps } from './mutual-row';

export { SuggestedRow } from './suggested-row';
export type { SuggestedRowProps } from './suggested-row';

export { PrivateListState } from './private-list-state';
export type { PrivateListStateProps } from './private-list-state';
