# Handoff

Last updated: 2026-05-10
Last verified: 2026-05-10

## Session Summary
- Removed the onboarding quiz flow entirely (usage intents, type interests, marketplace personality). Data had zero consumers; the social feed home screen it was designed for no longer exists.
- `onboarding_completed_at` is now set during profile completion. Auth flow simplified to: Login/Signup → Complete Profile → Tabs.

## Current State
- Auth flow is quiz-free. Profile completion sets `onboarding_completed_at`, preserving the "real user" filter used by search/explore/suggested RPCs.
- All V3 surfaces remain stable and operational. No regressions.
- Quiz DB tables (`user_usage_intents`, `user_marketplace_preferences`, `user_type_interests`) have been dropped via migration applied in Supabase Dashboard.

## Files Changed Recently
- `app/complete-profile/index.tsx` — added `markOnboardingComplete()` that sets `onboarding_completed_at`; called from both finish and skip paths.
- `lib/contexts/auth-context.tsx` — removed onboarding gate, `markOnboardingComplete`, `onboardingRequired` from `ProfileStatus`.
- `lib/supabase.ts` — `checkProfileStatus` no longer returns `onboardingRequired`.
- `lib/api/auth.ts` — `getProfileStatus` no longer selects `onboarding_completed_at`; `ProfileStatus` type simplified.
- `components/nav-menu.tsx` — removed "Onboarding (TEST)" dev link.
- `supabase/migrations/20260510000000_drop_onboarding_quiz_tables.sql` — drops three quiz tables.

## Files Deleted Recently
- `app/onboarding/index.tsx`
- `components/onboarding.tsx`
- `lib/api/user-preferences.ts`

## Incomplete Work
- **Crown Jewel assignment UI**: No detail-screen assign/unassign action yet.
- **Pinch-to-zoom in lightbox**: V1 ships swipe + counter + X-to-close only.
- **`InlineEditableField` extraction**: Still inlined in `upload-entry.tsx`.
- **`react-native-keyboard-controller` migration**: Requires leaving Expo Go.
- **`filter_traits` backfill**: Still only one account has data.

## Validation Performed
- All lints clean on all edited files.
- Grep sweep confirms zero dangling references to removed code (`onboardingRequired`, `saveOnboardingPreferences`, `user-preferences` imports, `markOnboardingComplete`).
- `onboarding_completed_at` verified still used correctly in `search.ts`, `explore.ts`, and RPC migrations.
- Migration applied manually via Supabase Dashboard — confirmed successful.

## Risks And Warnings
- **Existing users with null `onboarding_completed_at`**: They won't appear in search/explore/suggested results. Can be backfilled with a one-liner: `UPDATE users SET onboarding_completed_at = created_at WHERE onboarding_completed_at IS NULL AND display_name IS NOT NULL AND username IS NOT NULL`.
- **`FramedHero` prop interface** still cascades to both upload Review and CollectibleDetail. Treat changes as cross-surface.

## Next Best Task
End-to-end QA pass on the AI upload flow on a real device, then move to Crown Jewel assignment UI on the collectible detail screen.

## Suggested Starter Prompt
```
/rehydrate-project-memory — then run an end-to-end QA pass on the AI upload flow on a real device. After that, move to Crown Jewel assignment UI on the collectible detail screen.
```

## Memory Updates Made This Session
- `IMPLEMENTATION_LOG.md` — appended entry: "Remove Onboarding Quiz"
- `HANDOFF.md` — rewritten
- `CURRENT_STATE.md` — added auth flow context note, updated timestamps
- `DECISION_LOG.md` — new decision: "Remove onboarding quiz; set onboarding_completed_at during profile completion"
- `OPEN_THREADS.md` — added resolved thread for onboarding quiz, updated timestamps
- `DO_NOT_BREAK.md` — verified accurate, updated Last verified timestamp

## What Not To Touch
- Theme system (stable).
- Settings V3 (stable).
- Tracking Hub (stable).
- Market Surface (stable).
- Activity / Network surfaces (stable).
- `users.onboarding_completed_at` column — still used as "real user" filter.
- Listing copy character caps (90 / 420) without checking production data.
- `FramedHero` prop interface — cascades to both upload Review and CollectibleDetail.

## Proposed Updates To Watch For
- If personalized discovery surfaces are built (Market defaults, suggested collectors weighting), collect preferences in-context (e.g., Market empty state) rather than resurrecting a signup quiz.
- Existing users with null `onboarding_completed_at` may need a backfill before launch.
