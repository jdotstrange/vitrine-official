# Handoff

Last updated: 2026-08-14
Last verified: 2026-08-14

## Session Summary (2026-08-14 — Android-first compat, wait on APK)
- Audited native app for Android landmines (never had an Android EAS build; iOS-only soak). No iOS-only native packages. Five product bugs would fail on first install.
- Implemented OS-seam adapters on branch `feat/android-first-compat` (one codebase, not a fork). `runtimeVersion` `"2"` → `"3"` because `expo-clipboard` is a native module and the image-picker plugin config changed.
- **Founder gate: check in before cutting the preview APK.** Do not preview-OTA this onto existing runtime-`2` iOS IPAs.

## Current State
- Branch `feat/android-first-compat` has the adapters; **not merged, no EAS Android build.**
- Looking Glass engine still on Railway `942f4d2` from 2026-08-08.
- iOS preview daily-driver remains runtime `2` IPA `716627b5` (Aug 6).

## Incomplete Work
- **Cut preview Android APK** after founder OK (`eas build --profile preview --platform android` from `apps/native`).
- Later iOS IPA on runtime `3` if we want clipboard/Android-compat on iPhone (OTA will not land on runtime `2`).
- FCM `google-services.json` + Stream `MyVitrineAndroid` for push.
- Real SHA-256 in `assetlinks.json` after first Android signing key exists.
- Bullion/coins category decision (John + Frank).
- `extract-asset` edge PAT deploy.

## Validation Performed
- `read_lints` clean on touched native files.
- No Android device, no iOS regression device test this session.

## Risks And Warnings
- OTAing this JS to runtime-`2` iOS would crash on `expo-clipboard`.
- Push and verified https App Links will still fail on the first APK — expected.
- Upload `usePreventRemove` also covers the Upload **tab** (not just edit stack) — Android back mid-upload asks to discard, which is intentional.

## Next Best Task
**Founder check-in, then cut preview APK** if the adapter set looks right. Smoke on device: sign-in → avatar → upload 3 photos → system back mid-flow → share a showcase → DM attach.
