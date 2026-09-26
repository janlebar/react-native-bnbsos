# Next.js → React Native Sync (Behandier)

Tracks the work to bring the React Native app (`nativebnbsos`) inline with the
updated Next.js app (`behandier`). The RN app was last updated ~March 2026; the
Next.js app has since been rebranded to **Behandier** (`https://behandier.com`)
and gained many mobile-relevant changes.

Scope: **mobile-relevant changes only** (skip web-only SEO/blog/about/footer URLs).
Native identity (slug `testhandy`, bundle IDs `com.bnbsos.*`, scheme) is **kept**;
only visible branding changes.

## Status

| Part | Title | Status |
|------|-------|--------|
| 0 | Tracking scaffold + delta summary | ✅ done |
| 1 | Branding & environment (Behandier) | ✅ done |
| 2 | Categories 14 → 22 | ✅ done |
| 3 | Locations & region/city picker | ✅ done |
| 4 | Chat contract + dead-code cleanup | ✅ done |
| 5 | Data-model / type alignment | ✅ done |
| 6 | Profile & settings (`isOAuth`) | ✅ done (already aligned) |
| 7 | Static content (privacy/terms) | ⏭ skipped (web-only) |
| 8 | Cleanup + typecheck/lint + final status | ✅ done |
| 9 | Search parity with Next.js header | ✅ done |
| 10 | OAuth login rewrite (Better Auth social + JWT bridge) | ✅ done |
| 11 | Favorites (save contractors) | ✅ done |
| 12 | Home service carousel slides like the web | ✅ done |
| 13 | Schedule (role-aware, both roles) | ✅ done |

## Part documents

- `00-delta-summary.md` — full delta between the two apps
- `part-01-branding.md`
- `part-02-categories.md`
- `part-03-locations.md`
- `part-04-chat.md`
- `part-05-data-model.md`
- `part-06-profile-settings.md`
- `part-08-cleanup.md`
- `part-09-search.md`
- `part-10-oauth.md`
- `part-11-favorites.md`
- `part-12-carousel.md`
- `part-13-schedule.md`

## Backend (Next.js) changes made as part of this sync

- `app/api/mobile/contractors/available-locations/route.ts` (NEW) — regions/cities
  that have visible contractors; powers the RN location picker (Part 9).
- `app/api/mobile/favorites/route.ts` (NEW) — GET list + POST add (Part 11).
- `app/api/mobile/favorites/[contractorId]/route.ts` (NEW) — DELETE remove (Part 11).
- `app/api/user/appointments/route.ts` — returns `customer` on each appointment and
  includes the conversation `User` (Part 13).

## Outstanding follow-ups

1. **OAuth**: rewrite complete on the Expo side (Part 10). Verify at runtime with
   `EXPO_SCHEME=myapp` on the backend and Google/Facebook redirect URIs configured
   for `https://behandier.com/api/auth/callback/{google,facebook}`.
2. 4 pre-existing `tsc` errors (ChatLayout, SchedulePlanner, `debugScript.tsx`) —
   unrelated to this sync, listed in part-08.
3. Placeholder artwork for the 10 new category icons.
4. Optional: remove unused `components/BetterAuthLoginForm.tsx` (still references
   GitHub) in a future cleanup pass.

## Key references

- Next.js app: `/Users/test1/Documents/bnbsos/next-auth/next-auth`
- Mobile API surface: `app/api/mobile/**`, `app/api/chat/**`
- Locations data: `app/lib/locations.ts`
- Brand: `Behandier`, domain `https://behandier.com`
- Prisma schema: `prisma/schema.prisma`
