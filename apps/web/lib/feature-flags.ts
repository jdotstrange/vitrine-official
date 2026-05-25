/**
 * Feature flags for the web app.
 *
 * `WEB_FULL_EXPERIENCE` controls whether the full /v/* product surface
 * (Portfolio, Activity, Showcases, Messages, Network, Tracking, Explore,
 * Settings) is reachable from the browser.
 *
 * - `false` (default in production): only `/batch` (the standalone bulk
 *   uploader) is exposed. Direct hits to `/v/*` redirect to `/batch`.
 *   Login lands users on `/batch`.
 * - `true`: full app reachable; login lands on `/v` (Portfolio).
 *
 * Flip via NEXT_PUBLIC_WEB_FULL_EXPERIENCE=true (so middleware,
 * server components, and client code all see the same value).
 *
 * NOTE: NEXT_PUBLIC_* vars are baked into the client bundle at build
 * time. Toggling requires a redeploy.
 */

export const WEB_FULL_EXPERIENCE: boolean =
  process.env.NEXT_PUBLIC_WEB_FULL_EXPERIENCE === "true"

/**
 * The route a successfully-authenticated user should land on by default.
 * Use as the fallback for `?next=` query params from the login flow.
 */
export const POST_LOGIN_LANDING: "/v" | "/batch" = WEB_FULL_EXPERIENCE
  ? "/v"
  : "/batch"
