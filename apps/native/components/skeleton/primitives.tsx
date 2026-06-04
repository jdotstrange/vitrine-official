/**
 * Drop-in replacement for the legacy shimmer `Skeleton` API.
 * Prefer `SkeletonRect` / `SkeletonCircle` from `@/components/vault` for new code.
 */
export { SkeletonRect, SkeletonCircle, SkeletonGroup, SkeletonPulseProvider } from '@/components/vault';
export type { SkeletonRectProps, SkeletonCircleProps } from '@/components/vault';

import type { ViewStyle } from 'react-native';
import { SkeletonRect } from '@/components/vault';

interface LegacySkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: LegacySkeletonProps) {
  return <SkeletonRect width={width} height={height} radius={borderRadius} style={style} />;
}
