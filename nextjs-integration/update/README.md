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

## Part documents

- `00-delta-summary.md` — full delta between the two apps
- `part-01-branding.md`
- `part-02-categories.md`
- `part-03-locations.md`
- `part-04-chat.md`
- `part-05-data-model.md`
- `part-06-profile-settings.md`
- `part-08-cleanup.md`

## Outstanding follow-ups

1. **OAuth login rewrite** — `OAuthButtons.tsx`/`lib/auth.ts` still use removed
   legacy endpoints; migrate to Better Auth `signIn.social` +
   `POST /api/mobile/auth/social/token` (see part-04 / part-08).
2. 5 pre-existing `tsc` errors (ChatLayout, SchedulePlanner, `lib/auth.ts`,
   `debugScript.tsx`) — unrelated to this sync, listed in part-08.
3. Placeholder artwork for the 10 new category icons.

## Key references

- Next.js app: `/Users/test1/Documents/bnbsos/next-auth/next-auth`
- Mobile API surface: `app/api/mobile/**`, `app/api/chat/**`
- Locations data: `app/lib/locations.ts`
- Brand: `Behandier`, domain `https://behandier.com`
- Prisma schema: `prisma/schema.prisma`
