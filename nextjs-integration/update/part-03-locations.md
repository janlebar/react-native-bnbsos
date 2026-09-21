# Part 3 — Locations & region/city picker

## Done

- Added `lib/locations.ts` — port of the backend `app/lib/locations.ts`
  (11 European regions + city slugs) plus `normalizeToken` (NFD + diacritic
  stripping, matching `actions/available-locations.ts`) and label/display helpers.
- Added `components/home/LocationPickerModal.tsx` — self-contained modal
  (region accordion + city list + accent-insensitive search) built on RN primitives.
- `app/(auth)/home.tsx`:
  - New state `selectedRegionId` / `selectedCityId` + `locationPickerVisible`.
  - `effectiveLocation` memo: explicit picker selection wins → sends `region`
    (and `location` slug when a city is chosen), else falls back to
    device/profile city, else unfiltered.
  - All `/api/mobile/contractors/search` calls now pass `region` + `location`.
  - Added a "📍 {location}" button under the search bar to open the picker.
  - Effect/`useCallback` dependency arrays updated to `effectiveLocation`.

## Notes

- `ContractorSearchParams` and `Contractor.placementTier` already included
  `region` and `"VERIFIED"` in `types/home.ts` — no change needed there.
- `normalizeToken` is used for picker search + display resolution only; the
  server still does authoritative accent-insensitive matching.
- Device GPS is still used as a fallback (unchanged behaviour when no picker
  selection is made).
