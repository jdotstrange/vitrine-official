/**
 * App Store / TestFlight review demo account.
 *
 * Email is public (disclosed in Beta App Review notes). The OTP is validated
 * server-side only — never embed REVIEW_AUTH_CODE in the client bundle.
 */
export const REVIEW_AUTH_EMAIL = 'appreview@myvitrine.app';

export function isReviewAuthEmail(email: string): boolean {
  return email.trim().toLowerCase() === REVIEW_AUTH_EMAIL;
}
