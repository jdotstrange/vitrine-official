/**
 * Composed loading surfaces — built on V3 vault pulse primitives.
 *
 *   import { SkeletonRect, CollectibleDetailSkeleton, FeedSkeleton } from '@/components/skeleton';
 */

export {
  Skeleton,
  SkeletonRect,
  SkeletonCircle,
  SkeletonGroup,
  SkeletonPulseProvider,
} from './primitives';
export type { SkeletonRectProps, SkeletonCircleProps } from './primitives';

export {
  COLLECTIBLE_GRID_COLUMN_GAP,
  COLLECTIBLE_GRID_EDGE_PADDING,
  COLLECTIBLE_GRID_NUM_COLUMNS,
  getCollectibleGridCardWidth,
} from './collectible-grid-layout';
export {
  SpatialCardSkeleton,
  FeedSkeleton,
  GridCardSkeleton,
  CollectionGridSkeleton,
  COLLECTIBLE_GRID_ASPECT,
  collectibleGridPhotoHeight,
} from './feed';
export type { GridCardSkeletonProps } from './feed';

export {
  ConversationListSkeleton,
  MessageBubbleSkeleton,
  GroupCardSkeleton,
  GroupCardListSkeleton,
  MemberListSkeleton,
} from './messaging';

export {
  RecentDMsSkeleton,
  ActivityHeartbeatSkeleton,
  HappeningNowSkeleton,
  ForYouSkeleton,
  NewThisWeekSkeleton,
} from './community';

export { SearchRefetchOverlay } from './stale-overlay';
export {
  MarketMosaicSkeleton,
  SearchResultsAllSkeleton,
  SearchResultsCollectiblesSkeleton,
  SearchResultsListRowsSkeleton,
} from './market';

export { CollectibleDetailSkeleton } from '../skeletons/collectible-detail';
export { ProfileHubSkeleton } from '../skeletons/profile-hub';
export type { ProfileHubSkeletonProps } from '../skeletons/profile-hub';
export { ShowcaseDetailSkeleton } from '../skeletons/showcase-detail';
export { TrackingOverviewSkeleton } from '../skeletons/tracking-overview';
export type { TrackingOverviewSkeletonProps } from '../skeletons/tracking-overview';
