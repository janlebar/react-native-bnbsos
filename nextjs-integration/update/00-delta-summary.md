# Delta Summary — Next.js (Behandier) vs React Native (nativebnbsos)

Generated from analysis of both codebases. Drives the part-by-part sync.

## Branding

| Concern | RN (current) | Next.js (target) |
|---|---|---|
| Company name | `BnbSos Native` (`constants/index.ts`, `app.json`, `app/index.tsx`) | `Behandier` |
| Domain | `http://localhost:3000` / LAN IP | `https://behandier.com` |
| Logo | `assets/logo/BnbSos.svg` | `public/logo/Behandier.svg` |
| Tagline | "…handyman for your BnB!" | (web copy) |
| Bundle/slug | `com.bnbsos.nativebnbsos`, slug `testhandy` | **unchanged** (decision) |

## Categories

- RN `ServiceCarousel.tsx` maps **14** icon keys, imports typo `tuttoring.svg`, and
  references dropped keys `snow_removal`, `tree_pruning`.
- Backend `app/api/mobile/contractors/categories` returns **22**:

```
carpentry, car_washing_and_detailing, cleaning_services, electrical_services,
fencing, house_sitting, lawn_mowing, house_painting, personal_shopping,
plumbing, roofing, tiling, gardening, tutoring, elderly_care, foundation,
facades, window_installer, building_design, blind_shutter_services, canopy, other
```

## Locations / regions

- Backend `app/lib/locations.ts` defines **11 European regions** (Austria, Poland,
  Australia, Canada, Slovenia, Ireland, Germany, France, Spain, Italy, UK) with
  city slugs (lowercase, e.g. `london`). Matching is accent-insensitive (NFD).
- RN home screen is **GPS-only**; never sends `region` param (though
  `contractorsApi.searchContractors` already accepts it).

## Chat

- New first-message guard: `FIRST_MESSAGE_CONTACT_INFO_ERROR` (no email/phone in
  first message).
- Leads monetization: `Conversation.requiresLeadsSubscription` / `leadsAgeGateUntil`.
- RN `chatapi.tsx` does not surface either.
- Dead code: `constants/index.ts` `API_ENDPOINTS` and `utils/authenticatedFetch.ts`
  reference non-existent `/api/mobile/chat/*`; `lib/auth.ts` references undefined
  `verifyMobileSession`.

## Data model

- `Contractor.hiddenFromSearch Boolean @default(false)` (server filters testing rows).
- `Contractor.placementTier` includes `"VERIFIED"` (RN `premiumPlacement.ts` handles
  only `CITY_FIRST | PROFESSION_FIRST | TOP_FIVE`).
- `User.isOAuth` (RN settings type lacks it).

## Already aligned (no change needed)

- `X-Client-Platform: mobile` header, token rotation, "already used" refresh detection.
- `/api/chat/*`, `/api/mobile/contractors/{list,search,categories,[id]}`,
  `/api/mobile/profile/*`, `/api/mobile/contractor/*`, `/api/user/appointments`,
  `/api/contractors/by-user/*`, `/api/contractors/[id]/availability`.
