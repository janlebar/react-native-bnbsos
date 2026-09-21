# Part 5 — Data-model / type alignment

## Done

- `utils/premiumPlacement.ts`:
  - `PlacementTier` now includes `"VERIFIED"`.
  - `applyPremiumPlacement` excludes `VERIFIED` contractors from positioning
    (matches the web `app/[locale]/home/lib/premium-placement.ts` — verified
    badge only, no position boost).
  - Non-premium contractors are now sorted background-image-first (parity with web).
- Confirmed `types/home.ts` already had `placementTier` including `"VERIFIED"`,
  `region` in `ContractorSearchParams`, and `backgroundImageUrl` — no change needed.

## No change needed (server-side)

- `Contractor.hiddenFromSearch` — purely a backend filter (`hiddenFromSearch = false`
  applied in list/search/list queries). It is NOT returned in the mobile response
  shape, so no client type is required.
- `Conversation.requiresLeadsSubscription` / `leadsAgeGateUntil` — added to the
  `Conversation` type in Part 4; enforcement is web-client-side (see Part 4 notes).

## Notes

- `User` (api/types.ts) does not carry `isOAuth`; settings use the dedicated
  `SettingsUser` type (`api/settingsApi.ts`) which already has `isOAuth`.
