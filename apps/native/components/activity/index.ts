/**
 * Activity row primitives — surface-agnostic row renderers consumed
 * by the Activity lens (and any future surface that wants to embed
 * activity rows, e.g. a home-screen "what's new" strip).
 *
 * Three row variants map 1:1 to the three verb categories:
 *   - SocialRow   — INBOX verbs   (avatar-led, may include status pill)
 *   - SignalRow   — SIGNALS verbs (system glyph-led, kicker copy)
 *   - JournalRow  — JOURNAL verbs (your own actions, quieter chrome)
 *
 * TimeBucketHeader is the mono kicker that splits the lens into
 * TODAY / YESTERDAY / THIS WEEK / EARLIER sections.
 */

export { SocialRow } from './social-row';
export type { SocialRowProps } from './social-row';

export { SignalRow } from './signal-row';
export type { SignalRowProps } from './signal-row';

export { JournalRow } from './journal-row';
export type { JournalRowProps } from './journal-row';

export { TimeBucketHeader } from './time-bucket-header';
export type { TimeBucketHeaderProps } from './time-bucket-header';
