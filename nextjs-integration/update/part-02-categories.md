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

- The category icons are now **copied verbatim from the Next.js carousel**
  (`next-auth/next-auth/public/images/carousel/*.svg`) into `assets/icons/`,
  replacing the earlier placeholder silhouettes. This matches the established RN
  convention (`lawn_mowing.svg` was already an exact copy).
- `class`-based fills (`.st0{fill:#FFFFFF}` in `facades`, `lawn_mowing`, `tiling`)
  are ignored by `react-native-svg`, so those shapes render with the default black
  fill — same as the other icons on the light carousel background.
- `data/dataMap.tsx` (`plumber-2`/`painter-3` keys) and `data/carouselData.tsx`
  were **unreferenced dead code** — removed in Part 8.
- The carousel falls back to an `✨` emoji for any key without an icon; with the
  22-key map every backend key now resolves to an icon.
