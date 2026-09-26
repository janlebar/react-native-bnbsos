# Part 9 — Search parity with the Next.js header

Goal: make the RN home search behave like `components/header/header.tsx` +
`SearchStateContext` + `LocationCombobox` (query + region/city picker, debounced,
geo-detected fallback, and only locations that have contractors).

## Backend (Next.js) — NEW endpoint

- `app/api/mobile/contractors/available-locations/route.ts`
  - `GET` → `Region[]` filtered to regions/cities that have at least one visible
    (`hiddenFromSearch = false`) contractor.
  - Mirrors the web server action `getLocationsWithContractors()`
    (`actions/available-locations.ts`), including NFD/accent-insensitive token
    normalisation.
  - No auth required; CORS via `createCorsOptionsResponse()` / `addCorsHeaders`.

## RN changes

- `lib/locations.ts`:
  - `COUNTRY_TO_REGION` (ISO alpha-2 → region id).
  - `resolveDetectedLocation({ city, country })` — country → region, city name
    match (accent-insensitive), else region's first city.
  - `getFilteredRegions(query, regions)` — accent-insensitive region/city filter.
- `api/contractorsApi.ts` — `fetchAvailableLocations(): Promise<Region[]>`.
- `components/home/LocationPickerModal.tsx`:
  - New `regions` + `loading` props; renders only available regions.
  - Loading state + "No locations found" empty state.
  - Search now uses the shared `getFilteredRegions`.
- `app/(auth)/home.tsx`:
  - Loads available regions on mount (falls back to the full list on error).
  - Geo detection now resolves device GPS → supported **region + city slug**
    (was a raw city string), matching the backend `Contractor.city` slug.
  - `effectiveLocation` precedence: explicit picker selection → geo-detected
    location → none. Sent as `region` (+ `location` slug when a city is chosen)
    to `/api/mobile/contractors/search`.
  - Location button label reflects explicit selection or the detected location.
  - Modal receives `regions={availableRegions}` and `loading={!locationsLoaded}`.

## Notes / differences from web

- Web uses IP geolocation (`/api/geo`) + `localStorage` cache (24h TTL). RN uses
  device GPS (`expo-location`) + `isoCountryCode`, which is more accurate and needs
  no server round-trip or cache.
- Web applies the detected location on explicit search; RN applies it as the
  default fallback for live (debounced) search. Behaviourally equivalent.
- Web stores search in URL params; RN stores it in component state (single screen).
- **Location-only search**: matching `HomeClient.tsx` (`query || location || region`
  = search mode), selecting a region/city with no text/category now triggers a
  filtered search on RN too (previously it fell back to the unfiltered list).
  Sorting bar is shown whenever `query || category || explicitLocation`.
- Detected location alone does **not** trigger search mode (web parity); it only
  feeds query/category searches and the location label.
