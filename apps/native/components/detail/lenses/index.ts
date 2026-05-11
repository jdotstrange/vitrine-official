/**
 * Collectible Detail lens bodies — V3 lens system.
 *
 * Each module here is a self-contained surface that the
 * `CollectibleDetailV3` composition mounts inside a `LensPager` panel.
 * Lenses own their own scrolling, empty states, and Pro-gating logic;
 * the composition owns chrome (selector + dock + sheets) and shared
 * data (the collectible record, viewer state).
 *
 * Universal-visibility (Philosophy B): every lens always renders. Pro
 * gating happens *inside* the lens body via `LensPaywallCard`, not via
 * conditional chrome. Keeps the selector identical for free / Pro and
 * uses depth-of-conversion to drive upgrades.
 */

export { LensEmpty } from './lens-empty';
export { LensComingSoon } from './lens-coming-soon';

export { DetailsLens } from './details-lens';
export { SpecsLens } from './specs-lens';
export { PulseLens } from './pulse-lens';
export { AarLens } from './aar-lens';
export { VarLens } from './var-lens';
export { CompsLens } from './comps-lens';

export type { LensEmptyProps } from './lens-empty';
export type { LensComingSoonProps, LensComingSoonKey } from './lens-coming-soon';
export type { DetailsLensProps } from './details-lens';
export type { SpecsLensProps } from './specs-lens';
export type { PulseLensProps } from './pulse-lens';
export type { AarLensProps } from './aar-lens';
export type { VarLensProps } from './var-lens';
export type { CompsLensProps } from './comps-lens';
