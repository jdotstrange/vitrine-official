# Handoff

Last updated: 2026-07-29
Last verified: 2026-07-29

## Session Summary (2026-07-29 — native upload photo pipeline)
- **REACT-NATIVE-12 root-caused and fixed.** The `validatePath` crash was **edit mode**, not Live Photos: the speculative-upload effect had no remote-URI guard, so it called `new File("https://…")` on the Supabase storage URLs edit mode seeds into `photos`, and its failure handler cleared the cache entry so the effect re-fired every render. Fixed with a remote guard + an attempted-set, a named error (with the URI) in `readUriAsArrayBuffer`, a stricter `compressImage` fallback, a local-file gate on picked assets, and alerts on picker failures that used to be swallowed.
- **Live Photos need no normalization work** — verified in `expo-image-picker`'s `MediaHandler.swift` that requesting only `['images']` already yields a flattened still JPEG in cache. Opting into `livePhotos` would be a regression; see DO_NOT_BREAK.
- Unvalidated on device: the edit-flow photo path and the two new alert surfaces.

## Prior Session Summary
- **Web lander (`/`) v1 polish** — scroll-anchor nav, Sign in removed, footer policy-only, **dynamic Looking Glass theater** fed from Frank's public completed extractions (real photos + generic fields, 4.8s rotation).
- **Native fixes already on `main`** (prior sessions, committed): App Review login (`1be15d7`), cold-start boot hang (`1f07381`), other-profile crash + placeholder card (`fc56018` + production OTAs).

## Current State
- **`main` at `fc56018`** — native profile/boot/review fixes committed; **web lander changes uncommitted** (8 modified + 1 new file under `apps/web/`).
- **Home `/`** still composes full 10-section lander; nav/footer/intelligence theater updated for single-page launch posture; deep routes (`/product`, `/intelligence`, `/pricing`, `/login`) still live.
- **Production native** on 4.0.0 (5) with OTAs for boot + profile fixes; web deploy not run this session.

## Files Changed Recently (web — uncommitted)
- `apps/web/lib/marketing/constants.ts` — `SITE_NAV_LINKS`; removed `FOOTER_COLUMNS`.
- `apps/web/lib/marketing/intel-showcase.ts` (new) — Frank vault → theater payload mapper.
- `apps/web/app/page.tsx` — `getFrankIntelShowcases()` + parallel fetch with explore.
- `apps/web/components/marketing/MarketingSite.tsx` — passes `intelShowcases`.
- `apps/web/components/marketing/sections/SiteNav.tsx` — anchor links, no Sign in.
- `apps/web/components/marketing/sections/MobileNav.tsx` — same.
- `apps/web/components/marketing/sections/Footer.tsx` — Privacy + Terms only.
- `apps/web/components/marketing/sections/IntelligenceSection.tsx` — live showcase props, real photos, dynamic fields, stat bar removed.

## Incomplete Work
- **Commit + deploy web lander** — all web changes still local.
- **Broader lander plan not started:** hide/gate interior marketing routes, refresh hero screenshots for 4.0.0, honest TestFlight vs App Store CTA copy, middleware for public-only deploy.
- **Intel theater polish:** cross-fade between verticals if category jumps feel jarring; hash active nav highlighting.
- **Native carry-overs unchanged:** production OTA promote (post boot wave), Supabase OTP email Dashboard paste, battery quick wins, Upload Lane B-D, native session conflict.

## Validation Performed
- `read_lints` on edited web marketing files — clean.
- No browser preview, no `next build`, no deploy, no git commit this session.

## Risks And Warnings
- **Intel showcase quality varies** — random pool from Frank vault; sparse extractions may look thin despite score filter.
- **Deep pages still linked** from capability tiles (`href="/intelligence"`) and possibly stale CSS for removed `footer-cols` grid — harmless but dead weight.
- **`docs/ai-context/CURRENT_STATE.md` web section is stale** (still describes old nav, FOOTER_COLUMNS, mock theater) — needs update before next agent trusts it.
- Web + native work diverged: commit web separately from native OTAs.

## Next Best Task
**Browser-check `/` lander** (nav anchors, intel rotation with real photos, footer links) → **commit web changes** → decide route gating + hero screenshot refresh before Vercel deploy.

## Suggested Starter Prompt For Next Agent
`/rehydrate-project-memory. Uncommitted web lander work on main: anchor nav, no Sign in, policy footer, dynamic Looking Glass theater from Frank vault (intel-showcase.ts). Browser-test /, then commit apps/web/*. Native at fc56018 with profile/boot OTA fixes already shipped. Next: deploy lander — route gating, hero screenshots, CTA copy.`

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended 2026-06-24 web lander entry.
- `HANDOFF.md` — rewritten.
- `QUICK_REFERENCE.md` — sprint focus + dates refreshed (PM Health block N/A — not present in file).

## What Not To Touch
- Native upload/auth/boot paths unless regressions reported — recent OTAs are sensitive.
- `intel-showcase.ts` field mapper skip keys — aligned with native `buildEditableFields`; don't diverge casually.
- `/login` route — removed from nav only, not deleted.
- `supabase/.temp/*` — never commit.

## Proposed Updates To Watch For
- Update `CURRENT_STATE.md` Web Marketing section (nav, footer, dynamic intel, lander-in-progress).
- Add OPEN_THREADS row for lander deploy checklist (route gating, screenshots, CTA).
- Remove dead `footer-cols` CSS in `globals.css` when tidying.
- Cross-fade intel theater if founder feedback on rotation jumps.
