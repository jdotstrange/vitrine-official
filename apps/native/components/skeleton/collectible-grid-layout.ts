import { Dimensions } from 'react-native';

/** Matches market search + mosaic `CollectibleGridCard` 2-column layout. */
export const COLLECTIBLE_GRID_EDGE_PADDING = 16;
export const COLLECTIBLE_GRID_COLUMN_GAP = 10;
export const COLLECTIBLE_GRID_NUM_COLUMNS = 2;

export function getCollectibleGridCardWidth(
  screenWidth = Dimensions.get('window').width,
): number {
  return (
    (screenWidth -
      COLLECTIBLE_GRID_EDGE_PADDING * 2 -
      COLLECTIBLE_GRID_COLUMN_GAP * (COLLECTIBLE_GRID_NUM_COLUMNS - 1)) /
    COLLECTIBLE_GRID_NUM_COLUMNS
  );
}
