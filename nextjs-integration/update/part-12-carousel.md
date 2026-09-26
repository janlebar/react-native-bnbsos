# Part 12 — Home service carousel slides like the web

The RN `ServiceCarousel` was a free-scrolling horizontal `FlatList` (no snap, no
auto-advance). The web carousel (`app/[locale]/home/mainCarousel.tsx`) uses embla
with `loop: true`, auto-advances one item every **4000 ms** (`api.scrollNext()`),
and pauses on hover/focus. Part 12 brings the sliding behaviour to RN.

## Changes — `components/home/ServiceCarousel.tsx`

- **Snap / slide one item at a time**: `snapToInterval={ITEM_WIDTH + ITEM_SPACING}`,
  `snapToAlignment="start"`, `decelerationRate="fast"`, `disableIntervalMomentum`.
- **Auto-advance every 4s** (matches `AUTO_SCROLL_INTERVAL_MS = 4000`): an interval
  calls `scrollToIndex(next, { animated: true })`, looping back to index 0 after
  the last full page.
- **Pause on interaction**: `onScrollBeginDrag` pauses (mobile analogue of the web
  hover/focus pause); `onMomentumScrollEnd` resumes and records the current index.
- **Reliable programmatic scrolling**: `getItemLayout` + `onScrollToIndexFailed`
  fallback.
- Reset to index 0 when the category list changes.
- Preserved the existing category-select (tap to filter) behaviour and the 22-key
  icon map from Part 2.

## Notes / differences from web

- Web uses `embla-carousel`'s true infinite `loop` (clones). RN wraps to the first
  full page with an animated scroll-back (no clone duplication) — visually similar,
  simpler, and avoids duplicate keys.
- Web shows `CarouselPrevious` / `CarouselNext` arrow buttons; RN relies on swipe
  (arrows overlaid on 3.5 visible tiles would crowd the touch targets). Can be added
  later if desired.
- `react-native-reanimated-carousel` is in `package.json` but **unusable**: it needs
  `react-native-gesture-handler`, which is not installed. The FlatList approach
  needs no new dependencies.
