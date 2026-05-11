/**
 * Centralized constants for the Vitrine app.
 * All URLs, identifiers, and magic values live here.
 */

export const APP_SHARE_DOMAIN = 'https://myvitrine.app';

export const SHARE_URLS = {
  collectible: (id: string) => `${APP_SHARE_DOMAIN}/s/c/${id}`,
  showcase: (id: string) => `${APP_SHARE_DOMAIN}/s/s/${id}`,
  profile: (id: string) => `${APP_SHARE_DOMAIN}/s/p/${id}`,
} as const;

export const IMAGE_UPLOAD = {
  maxDimension: 1200,
  jpegQuality: 0.8,
  storageBucket: 'collectible-images',
} as const;

export const ADAPTIVE_IMAGE = {
  targetAspectRatio: 4 / 5,
  deviationThreshold: 0.25,
  blurRadius: 30,
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  feedPageSize: 10,
} as const;
