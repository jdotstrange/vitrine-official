/**
 * Formats a number for consistent display throughout the app
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    const m = count / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
}
