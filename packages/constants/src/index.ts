/**
 * @vitrine/constants — cross-platform constants.
 *
 * URLs, identifiers, and magic values shared between native and web.
 * Pure values only — if it needs a runtime dependency, it belongs in
 * an app or in @vitrine/api.
 */

// ---------------------------------------------------------------------------
// SHARE URLS — myvitrine.app/s/{c,s,p}/{id}
// ---------------------------------------------------------------------------

export const APP_SHARE_DOMAIN = 'https://myvitrine.app';

export const SHARE_URLS = {
  collectible: (id: string) => `${APP_SHARE_DOMAIN}/s/c/${id}`,
  showcase: (id: string) => `${APP_SHARE_DOMAIN}/s/s/${id}`,
  profile: (id: string) => `${APP_SHARE_DOMAIN}/s/p/${id}`,
} as const;

// ---------------------------------------------------------------------------
// STORE URLS — published native app surfaces.
// ---------------------------------------------------------------------------

export const APP_STORE_URL = 'https://apps.apple.com/us/app/myvitrine/id6451114604';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vitrine.mobile';

// ---------------------------------------------------------------------------
// IMAGE UPLOAD — defaults applied across native upload flows. Web's bulk
// upload (Day 3+) reads the same limits.
// ---------------------------------------------------------------------------

export const IMAGE_UPLOAD = {
  maxDimension: 1200,
  jpegQuality: 0.8,
  storageBucket: 'collectible-images',
} as const;

// ---------------------------------------------------------------------------
// ADAPTIVE IMAGE — FramedHero render contract.
// ---------------------------------------------------------------------------

export const ADAPTIVE_IMAGE = {
  targetAspectRatio: 4 / 5,
  deviationThreshold: 0.25,
  blurRadius: 30,
} as const;

// ---------------------------------------------------------------------------
// PAGINATION — request defaults shared by feed and list endpoints.
// ---------------------------------------------------------------------------

export const PAGINATION = {
  defaultPageSize: 20,
  feedPageSize: 10,
} as const;
