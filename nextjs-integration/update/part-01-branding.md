# Part 1 — Branding & environment (Behandier)

## Done

- Copied `public/logo/Behandier.svg` → `assets/logo/Behandier.svg`.
- `app/index.tsx` — import `Behandier.svg`; tagline updated to
  "Hi there! Let us find a vetted contractor for your home!".
- `constants/index.ts` — `APP_CONFIG.name = "Behandier"`.
- `app.json` — `name: "Behandier"` (slug/bundle IDs/scheme unchanged).
- `.env.example` — added production URL comment `https://behandier.com`.

## Deliberately unchanged

- `slug: "testhandy"`, `bundleIdentifier`/`package: com.bnbsos.nativebnbsos`,
  `scheme: "myapp"` — kept to avoid breaking EAS/App Store identity.
- `lib/auth-client.ts` `storagePrefix: "nativebnbsos"` and `lib/auth.ts`
  `scheme: "nativebnbsos"` — internal identifiers (storage key + OAuth redirect
  scheme). Changing these would log users out / break OAuth, so they stay.
- Documentation files (`security.md`, `README.md`, `nextjs-integration/*`) that
  still mention "BnbSos Native" — left as historical docs, out of app scope.

## To verify later

- `APP_CONFIG.name` isn't rendered anywhere user-visible today (grep confirmed).
  If a settings/about screen is added later, use `APP_CONFIG.name`.
