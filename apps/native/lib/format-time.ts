/**
 * Formats a date into a relative time string
 * Consistent timestamp formatting throughout the app
 */
export function formatTimeAgo(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  // For older dates, show "Mon D" format
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a date prefixed with "Added" using IG-style relative/absolute timing.
 * "on" is only appended to absolute dates (grammatically correct).
 *  - < 1 minute:   "Added just now"
 *  - < 1 hour:     "Added Xm ago"
 *  - same day:     "Added today"
 *  - 1 day ago:    "Added yesterday"
 *  - < 7 days:     "Added Xd ago"
 *  - same year:    "Added on Apr 20"
 *  - older:        "Added on Apr 20, 2024"
 */
export function formatAddedOn(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Added just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Added ${minutes}m ago`;

  const sameCalendarDay =
    now.getFullYear() === then.getFullYear() &&
    now.getMonth() === then.getMonth() &&
    now.getDate() === then.getDate();
  if (sameCalendarDay) return 'Added today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === then.getFullYear() &&
    yesterday.getMonth() === then.getMonth() &&
    yesterday.getDate() === then.getDate();
  if (isYesterday) return 'Added yesterday';

  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days < 7) return `Added ${days}d ago`;

  const sameYear = now.getFullYear() === then.getFullYear();
  const formatted = then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return `Added on ${formatted}`;
}
