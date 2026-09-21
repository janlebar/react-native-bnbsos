# Part 8 — Cleanup, typecheck & final status

## Done

- Deleted dead code (all confirmed unreferenced):
  - `utils/authenticatedFetch.ts` (duplicate axios client with wrong `/api/mobile/chat/*`)
  - `data/dataMap.tsx`, `data/carouselData.tsx`
  - `components/ClientCarousel.tsx`
  - Stale icons: `snow_removal.svg`, `tree_pruning.svg`, `painting_services.svg`,
    `plumbing_services.svg`, `roofing_services.svg`
- Added `contractorId?: number | null` to `User` (api/types.ts) — the login response
  carries it; fixes the `LoginForm.tsx` type error.

## Typecheck (`npx tsc --noEmit`)

5 pre-existing errors remain — **none introduced by this integration**:

| File | Error | Status |
|------|-------|--------|
| `app/(auth)/chat/components/ChatLayout.tsx:114` | `(contactId: string) => void` vs `string \| null` | pre-existing |
| `app/(auth)/chat/components/SchedulePlanner.tsx:112` | missing `badgeConfirmed` style | pre-existing |
| `lib/auth.ts:124` | `verifyMobileSession` undefined (legacy OAuth) | pre-existing — see Part 4 follow-up |
| `utils/debugScript.tsx` (4×) | `results` possibly undefined | pre-existing dev-only |

No lint script is configured in the project.

## Follow-ups to carry into the next part

1. **OAuth login rewrite** (highest priority): `OAuthButtons.tsx` + `lib/auth.ts` use
   removed legacy endpoints. Migrate to Better Auth `authClient.signIn.social` +
   `POST /api/mobile/auth/social/token`.
2. Fix the 5 pre-existing type errors above (2 small UI fixes + remove/fix
   `lib/auth.ts` OAuth code + guard `debugScript.tsx`).
3. Optional: bespoke artwork for the 10 new category icons (currently placeholder
   silhouettes).
