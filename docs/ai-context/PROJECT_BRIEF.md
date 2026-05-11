# Project Brief

Last updated: 2026-04-29

## Product
Vitrine is a mobile-first collecting app for showcasing, managing, discovering, and communicating around high-value collectibles and memorabilia.

## Build Type
Expo React Native app using Expo Router, Supabase, Stream Chat/Feeds, and a custom V3 design system.

## Business Goal
Create a premium collector platform that can support authenticated user profiles, collectible detail views, showcases, marketplace-adjacent signals, and future Pro-grade analysis surfaces.

## User Types
- Collectors managing personal collections.
- Visitors viewing other collectors' profiles and showcases.
- Power users who may eventually subscribe to advanced analysis/reporting features.
- Admin/operations users: Unknown in this repo, though docs mention an Admin PWA elsewhere.

## Core Jobs To Be Done
- Authenticate with email/phone OTP.
- Create, view, and manage collectibles.
- Display AI-enriched collectible metadata.
- Organize collectibles into showcases.
- View collector profiles across Profile, Collection, and Showcase surfaces.
- Track/follow, message, share, and scan profile/showcase surfaces.

## Success Criteria
- Runs in Expo Go during development.
- Remains compatible with managed EAS/TestFlight release path.
- Uses Supabase safely through env vars and RLS-aware APIs.
- Uses V3 design tokens and `components/vault` for new redesign work.
- Keeps project memory current enough for a new Cursor chat to resume without old chat history.

## Stack
- Expo SDK 54, React 19, React Native 0.81, Expo Router.
- TypeScript strict mode.
- Supabase Auth/PostgREST/Edge Functions/migrations.
- Stream Chat and Stream Activity Feeds.
- Jest Expo, ESLint.
- V3 design system in `lib/design` and `components/vault`.

## Non-Negotiables
- Do not break Expo Go compatibility without explicit approval.
- Do not hardcode secrets or client env values.
- Do not connect production systems or add MCP production write access without explicit approval.
- New V3 UI should consume `@/lib/design` and `@/components/vault`.
- Existing user changes must not be reverted unless explicitly requested.

## Out Of Scope
- Production credential setup.
- Production DB writes from automation.
- MCP installation/configuration unless explicitly requested.
- Rewriting product architecture as part of memory installation.

## Notes
Assumption: `vitrinev0` is the active app repo even though the initial environment reported no git repo.
