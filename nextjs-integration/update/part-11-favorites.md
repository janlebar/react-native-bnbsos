# Part 11 — Favorites

Ports the web favorites feature (`components/ui/favorite-button.tsx`,
`app/[locale]/favorites/*`, `actions/favorites.ts`, and the `/favorites` link in
`components/header/profilemenu.tsx`) to the Expo app.

## Backend (Next.js) — NEW endpoints

- `app/api/mobile/favorites/route.ts`
  - `GET` → `{ success, contractors: [...], ids: number[] }` for the signed-in user
    (auth required). Contractor shape mirrors `/api/mobile/contractors/list`
    (incl. `backgroundImageUrl`, premium fields, contact info) plus `favoritedAt`.
  - `POST` → `{ success }` add. Body `{ contractorId }`. Idempotent (already
    favorited → success).
- `app/api/mobile/favorites/[contractorId]/route.ts`
  - `DELETE` → `{ success }` remove. Idempotent.

Uses `getCurrentAuthUser()` (JWT or cookie) and the existing `Favorite` Prisma
model (`@@unique([userId, contractorId])`).

## RN changes

- `api/favoritesApi.ts` — `getFavorites()`, `addFavorite(id)`, `removeFavorite(id)`.
- `lib/favorites-context.tsx` — `FavoritesProvider` + `useFavorites()`:
  `favoriteIds`, `contractors`, `isLoading`, `canUseFavorites`, `isFavorite(id)`,
  `toggleFavorite(id)` (optimistic + revert on error), `refresh()`. Clears state
  on sign-out; loads on sign-in.
- `app/_layout.tsx` — wrapped the app in `FavoritesProvider`.
- `components/FavoriteButton.tsx` — heart toggle (❤️ / 🤍); hidden unless
  `canUseFavorites`.
- `components/home/ContractorCard.tsx` — replaced the placeholder 🤍 with
  `FavoriteButton` (overlay position). Removed the now-unused `onFavoritePress`
  prop from the card + `ContractorGrid`.
- `app/(auth)/contractors/[id].tsx` — added `FavoriteButton` to the hero
  (top-right).
- `app/(auth)/favorites.tsx` — NEW screen: loading/empty states + `ContractorGrid`
  of saved contractors; refreshes on focus. Shows an "unavailable" state if opened
  in contractor mode.
- `app/profile.tsx` — added a **Favorites** link (non-contractor accounts only,
  matching the web profile menu).

## Contractor mode gating

Favorites are a **customer-facing** feature and are disabled whenever the user is
in contractor mode (`user.isContractor === true`). This is expressed once as
`canUseFavorites = isAuthenticated && !user.isContractor` in the context:

- `FavoriteButton` renders nothing unless `canUseFavorites` (so no hearts on cards
  or contractor detail while in contractor mode).
- The context clears and does not load favorites for contractors, and
  `toggleFavorite` is a no-op.
- The `/favorites` screen shows an "unavailable" state.
- The profile link is hidden for contractors.

## Notes / differences from web

- Web calls `isContractorFavorited` per card (N requests). RN loads the favorites
  list once into a shared context (`favoriteIds`), so cards/detail are O(1) and
  stay in sync without per-card status requests.
- Web read path does not filter `hiddenFromSearch`/`confirmed`; RN matches that
  (explicitly saved favorites are always returned).
- Note: `user.isContractor` is the **active role** (kept in sync by
  `applyDisplayRoleHint` / `updateUser`), so gating follows role switches.
