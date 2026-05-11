/**
 * Profile lens bodies — surfaces consumed by the `collector-profile`
 * hub pager. Each export is the render-body for one lens (no SafeArea,
 * no top chrome) and is also reused by any standalone routes that need
 * the same surface.
 *
 * Lens contract:
 *   - Each body is `flex: 1` on `COLORS.void`.
 *   - Each body owns its own scrolling/list state.
 *   - Bodies do NOT render the parent's lens selector or back nav.
 *   - Bodies that need to clear bottom-tab chrome accept a numeric
 *     offset prop (e.g., `fabBottomOffset`) and do their own absolute
 *     positioning.
 */

export { MessageInboxBody } from './message-lens';
export type { MessageInboxBodyProps } from './message-lens';

export { ActivityLens } from './activity-lens';
export type { ActivityLensProps } from './activity-lens';
export { NetworkLens } from './network-lens';
export type { NetworkLensProps, NetworkTab } from './network-lens';

export { PlaceholderLens } from './placeholder-lens';
export type { PlaceholderLensProps } from './placeholder-lens';
