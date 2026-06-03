/**
 * Vault components — V3 DNA. Barrel export.
 *
 * Prefer `import { ... } from '@/components/vault'` over deep-path
 * imports from individual files. Gives us one stable entry point and
 * makes future internal restructuring painless.
 *
 * Component architecture follows three patterns:
 *
 *   Atoms            — pure display, one job each.
 *                      StatusPill, StatusDot, TraitPill, MatchPercent,
 *                      StatCell, SchemaRow, IconButton, Button, Avatar,
 *                      Chip, SkeletonRect, SkeletonCircle
 *
 *   Shells           — generic layouts that compose with variant content
 *                      via children. GridCard, ListCard, TopBar, FilterSheet
 *
 *   Compositions     — shell + purpose-built meta. CompCard = GridCard
 *                      + CompMeta. SpatialCard / CollectibleGridCard /
 *                      CollectibleListCard = the three-mode collectible
 *                      thumbnail family sharing a CollectibleCardData type.
 *
 *   Standalone       — components that don't fit a shell but are universal
 *                      primitives. SearchBar, LensSelector, EmptyState
 *
 * Shared configuration (STATUS_CONFIG, TRAIT_CONFIG, match tiers, tokens)
 * lives in @/lib/design — not here. Components *consume* the design
 * system; they don't *own* it.
 */

// Atoms ---------------------------------------------------------------
export { StatusPill } from './status-pill';
export { StatusDot } from './status-dot';
export { TraitPill } from './trait-pill';
export { MatchPercent } from './match-percent';
export { StatCell } from './stat-cell';
export { SchemaRow } from './schema-row';
export { CustomFieldsEditor } from './custom-fields-editor';
export { IconButton } from './icon-button';
export { Button } from './button';
export { Avatar } from './avatar';
export { Chip } from './chip';
export { Brackets } from './brackets';
export { SkeletonRect, SkeletonCircle, SkeletonGroup } from './skeleton';
export { ViewCountBadge } from './view-count-badge';

// Shells --------------------------------------------------------------
export { GridCard } from './grid-card';
export { ListCard } from './list-card';
export { TopBar } from './top-bar';
export { FilterSheet } from './filter-sheet';
export { HolographicFrame } from './holographic-frame';
export { DossierCard } from './dossier-card';

// Dossier-zone compositions ------------------------------------------
export { MetricCardRow, metricValueTextStyle } from './metric-card-row';
export { AssetMatrixCard } from './asset-matrix-card';
export { StatusBreakdownGrid } from './status-breakdown-grid';
export { TraitMixCard } from './trait-mix-card';

// Telemetry / observability primitives -------------------------------
// Distinct DNA from DossierCard — used by monitoring surfaces (RADAR
// tracking hub, future portfolio dashboards). No corner brackets;
// composes value + delta + sparkline panels in observability-card style.
export { Sparkline } from './sparkline';
export { TelemetryCard } from './telemetry-card';

// Modals / overlays --------------------------------------------------
export { ActionSheet } from './action-sheet';

// Standalone primitives ----------------------------------------------
export { SearchBar } from './search-bar';
export { LensSelector } from './lens-selector';
export { LensPager } from './lens-pager';
export { EmptyState } from './empty-state';
export { ActionDock } from './action-dock';
export { DetailActionDock } from './detail-action-dock';
export { LensPaywallCard } from './lens-paywall-card';
export { InputDialog } from './input-dialog';
export { ShowcaseSelectorSheet } from './showcase-selector-sheet';
export { FieldEditor } from './field-editor';
export { RapidFireEdit } from './rapid-fire-edit';
export { PhotoReorderGrid } from './photo-reorder-grid';

// Keyboard surfaces --------------------------------------------------
// Three archetypes covering every TextInput context in the app.
// KeyboardSafeScroll  = multi-field forms (auto-scroll focused input).
// KeyboardSafeSheet   = modals / chat threads (KAV padding semantics).
// KeyboardSafeComposer = standalone sticky composer bars.
// The global Prev/Next/Done accessory bar is mounted once in app/_layout.tsx,
// so individual call sites only choose the right wrapper for their shape.
export { KeyboardSafeScroll } from './keyboard-safe-scroll';
export { KeyboardSafeSheet } from './keyboard-safe-sheet';
export { KeyboardSafeComposer } from './keyboard-safe-composer';

// Compositions --------------------------------------------------------
export { CompCard, CompMeta } from './comp-card';
export { SpatialCard } from './spatial-card';
export { CollectibleGridCard, CollectibleGridMeta } from './collectible-grid-card';
export { CollectibleListCard } from './collectible-list-card';

// Branded icons -------------------------------------------------------
// Drop-in replacements for select lucide-react-native glyphs. Same
// `{ size, color, strokeWidth }` prop shape so call sites swap cleanly.
export { CollectibleIcon, ShowcaseIcon, UploadCollectibleIcon, VitrineMarkIcon } from './icons';
export type {
  CollectibleIconProps,
  ShowcaseIconProps,
  UploadCollectibleIconProps,
  VitrineMarkIconProps,
} from './icons';

// Types ---------------------------------------------------------------
export type { CompData } from './comp-card';
export type { CollectibleCardData } from './spatial-card';
export type { AvatarSize, AvatarProps } from './avatar';
export type { ButtonProps } from './button';
export type { IconButtonProps } from './icon-button';
export type { ChipProps } from './chip';
export type { TopBarProps } from './top-bar';
export type { SearchBarProps, SearchBarHandle } from './search-bar';
export type { LensItem, LensSelectorProps } from './lens-selector';
export type { LensPagerProps, LensPagerHandle } from './lens-pager';
export type { FilterSheetProps } from './filter-sheet';
export type { HolographicFrameProps } from './holographic-frame';
export type { EmptyStateProps } from './empty-state';
export type { ActionDockProps } from './action-dock';
export type { DetailActionDockProps, DetailActionDockAction } from './detail-action-dock';
export type { LensPaywallCardProps, LensPaywallKey } from './lens-paywall-card';
export type { InputDialogProps } from './input-dialog';
export type {
  ShowcaseSelectorSheetProps,
  ShowcaseSelectorOption,
} from './showcase-selector-sheet';
export type { FieldEditorProps, FieldEditorValue } from './field-editor';
export type { RapidFireEditProps, RapidFireEditItem } from './rapid-fire-edit';
export type { PhotoReorderGridProps, PhotoAsset } from './photo-reorder-grid';
export type { SpatialCardProps } from './spatial-card';
export type { CollectibleGridCardProps } from './collectible-grid-card';
export type { CollectibleListCardProps } from './collectible-list-card';
export type { SkeletonRectProps, SkeletonCircleProps } from './skeleton';
export type { ViewCountBadgeProps } from './view-count-badge';
export type { BracketsProps } from './brackets';
export type { DossierCardProps } from './dossier-card';
export type { MetricCardRowProps, MetricCardEntry } from './metric-card-row';
export type {
  AssetMatrixCardProps,
  AssetMatrixSegment,
} from './asset-matrix-card';
export type {
  StatusBreakdownGridProps,
  StatusBreakdownEntry,
} from './status-breakdown-grid';
export type { TraitMixCardProps, TraitMixEntry } from './trait-mix-card';
export type { SparklineProps } from './sparkline';
export type {
  TelemetryCardProps,
  TelemetryPanel,
  TelemetryLiveStrip,
  TelemetryDeltaDirection,
} from './telemetry-card';
export type { ActionSheetProps, ActionSheetOption } from './action-sheet';
export type { KeyboardSafeScrollProps } from './keyboard-safe-scroll';
export type { KeyboardSafeSheetProps } from './keyboard-safe-sheet';
export type { KeyboardSafeComposerProps } from './keyboard-safe-composer';
