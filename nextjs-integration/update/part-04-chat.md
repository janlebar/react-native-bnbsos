# Part 4 — Chat contract + dead-code cleanup

## Done

- `app/(auth)/chat/components/MessageInput.tsx` — send/reply errors now surface the
  server's message instead of a hardcoded fallback, so the backend first-message
  contact-info guard (`FIRST_MESSAGE_CONTACT_INFO_ERROR`) is shown to the user.
- `api/chatapi.tsx` — added `requiresLeadsSubscription` / `leadsAgeGateUntil` to the
  `Conversation` type (lead-monetization fields the backend returns).
- `constants/index.ts` — corrected `API_ENDPOINTS` chat paths from
  `/api/mobile/chat/*` to `/api/chat/*`.
- Deleted `utils/authenticatedFetch.ts` — confirmed unreferenced duplicate axios
  client with the wrong `/api/mobile/chat/*` paths (security.md also recommended
  removing this duplication).

## Flagged (follow-up needed, not done here)

- **OAuth flow is broken** and out of scope for this part:
  `components/OAuthButtons.tsx` → `lib/auth.ts` `AuthManager.signInWithOAuth` still
  targets legacy NextAuth endpoints `/api/auth/mobile/signin/{provider}` and
  `/api/auth/token`, plus references the undefined `authService.verifyMobileSession`.
  The backend now uses Better Auth + `POST /api/mobile/auth/social/token`.
  `lib/auth.ts` / `OAuthButtons.tsx` need a rewrite to:
  1. `authClient.signIn.social({ provider, callbackURL })` (Better Auth expo client), then
  2. `POST /api/mobile/auth/social/token` to exchange the session cookie for the
     JWT pair (same shape as `/api/mobile/auth/login`).
  Recommend a dedicated part for this.

## Notes

- Sending a reply is NOT blocked server-side by `requiresLeadsSubscription` (the
  lock is applied client-side in the web app). A full leads paywall for mobile is
  a separate Stripe feature and was intentionally left out of this pass.
