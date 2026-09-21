# Part 2 — Categories (14 → 22)

## Done

- `components/home/ServiceCarousel.tsx` — `CATEGORY_ICONS` now mirrors the 22
  backend keys from `/api/mobile/contractors/categories`.
- Renamed icon file `tuttoring.svg` → `tutoring.svg` (typo fix) and corrected the
  import.
- Removed stale icon entries `snow_removal` and `tree_pruning` (dropped by backend).
- Added 10 new icon SVGs under `assets/icons/`:
  `carpentry, gardening, elderly_care, foundation, facades, window_installer,
  building_design, blind_shutter_services, canopy, other`.

## Notes

- New icons are **simple placeholder silhouettes** (consistent 24x24 filled style).
  Bespoke artwork matching the web brand is still pending — flagged for design.
- `data/dataMap.tsx` (`plumber-2`/`painter-3` keys) and `data/carouselData.tsx`
  are **unreferenced dead code** — see Part 8 cleanup.
- The carousel falls back to an `✨` emoji for any key without an icon; with the
  22-key map every backend key now resolves to an icon.
