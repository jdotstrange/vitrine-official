/**
 * Launch gate: Pro-tier surfaces ship visible with "coming soon" teasers
 * instead of live functionality or purchase flows.
 */
export const PRO_SHIP_DARK = true;

export const PRO_COMING_SOON_CTA = 'Learn about Vitrine Pro';

export type ProFeatureKey = 'PULSE' | 'AAR' | 'VAR' | 'MANAGED';

export const PRO_FEATURE_COPY: Record<
  ProFeatureKey,
  { title: string; blurb: string }
> = {
  PULSE: {
    title: 'Market Pulse',
    blurb:
      'Live market intelligence for this specific piece — demand signals, price velocity, population scarcity, and alerts the moment something moves.',
  },
  AAR: {
    title: 'Autograph Assessment Report',
    blurb:
      'Signature authenticity scoring for autographed pieces — stroke-pattern analysis, pressure dynamics, and exemplar comparison so you have a confidence rating before you commit.',
  },
  VAR: {
    title: 'Vitrine Analysis Report',
    blurb:
      'Deep-dive authentication and condition analysis — visual pattern matching, defect detection, population data, and comparable-sales context, packaged as a definitive cataloging record.',
  },
  MANAGED: {
    title: 'AI Smart Showcases',
    blurb:
      'Rule-based showcases that update automatically as your collection changes — set conditions like type, value, or traits and let Vitrine keep the album in sync.',
  },
};

export const VITRINE_PRO_SHEET_BULLETS = [
  'Market Pulse — per-piece market intelligence',
  'Autograph Assessment Reports — signature confidence',
  'Vitrine Analysis Reports — deep cataloging analysis',
  'AI Smart Showcases — auto-updating curated albums',
] as const;
