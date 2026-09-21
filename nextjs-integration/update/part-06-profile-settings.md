# Part 6 — Profile & settings (isOAuth)

## Result: already aligned — no code changes required

- `api/settingsApi.ts` `SettingsUser` already includes `isOAuth: boolean`, and
  `UpdateSettingsData` documents that password/2FA fields must be omitted for
  OAuth users.
- `app/(auth)/settings.tsx` already:
  - Skips `password` / `newPassword` / `isTwoFactorEnabled` in the save payload
    when `settingsUser.isOAuth` is true (line ~170).
  - Renders an OAuth notice and hides the password/2FA fields for OAuth users
    (Security section).

## Follow-up (unchanged from Part 4)

- The OAuth **login** flow itself (`OAuthButtons.tsx` → `lib/auth.ts`) is still
  on legacy endpoints and needs a rewrite to Better Auth + `/api/mobile/auth/social/token`.
  This is independent of the settings `isOAuth` handling, which is already correct.
