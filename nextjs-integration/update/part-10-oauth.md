# Part 10 — OAuth login rewrite (Better Auth social + mobile JWT bridge)

Resolves the follow-up flagged in Part 4: the Expo OAuth flow was still calling
removed legacy endpoints (`/api/auth/mobile/signin/[provider]`,
`/api/auth/token`) and referenced the undefined `authService.verifyMobileSession`.

## New flow

1. `authClient.signIn.social({ provider, callbackURL })` — the
   `@better-auth/expo` client opens the provider consent screen and stores the
   Better Auth session cookie in SecureStore.
2. `authClient.getCookie()` — read the stored session cookie.
3. `POST /api/mobile/auth/social/token` (with `Cookie` + `X-Client-Platform: mobile`)
   — bridge endpoint returns `{ token, refreshToken, loginAs, user }` in the same
   shape as `/api/mobile/auth/login`.
4. Persist `token` / `refreshToken` via `utils/secureStore` and return the user.

## Changes

- `lib/auth.ts` — rewrote `AuthManager.signInWithOAuth`; removed the dead
  `exchangeCodeForToken` and the `expo-auth-session` / `expo-crypto` imports.
  (Imported secure-store helpers are aliased to `persistToken` /
  `persistRefreshToken` to avoid clashing with the legacy local `saveToken`.)
- `components/OAuthButtons.tsx` — providers now **Google + Facebook** (was
  Google + Apple).
- `constants/index.ts` — `OAUTH_PROVIDERS` now **google + facebook** (was
  google + github).

## Why Google + Facebook

The backend `auth.ts` `socialProviders` only configures `google` and `facebook`
(GitHub was replaced; Apple is not configured). Matches
`ImplementationHistory/OauthUpdate/Oauthupdate.md`.

## Prerequisites / notes

- Backend env: `EXPO_SCHEME=myapp` must match `app.json` `scheme` (`myapp`); the
  app `authClient` expo plugin already uses `scheme: "myapp"`.
- `callbackURL` uses the deep link `myapp://home` (`APP_SCHEME`).
- `components/BetterAuthLoginForm.tsx` (unused demo form) still references GitHub;
  left untouched — can be removed in cleanup.
