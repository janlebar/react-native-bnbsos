## Expo Go – What the Next.js App Must Implement

This document is for the **Next.js backend** that serves the Expo app `nativebnbsos` (including when it runs in **Expo Go**).

It explains **what you need to implement in the Next.js project** so that:
- Mobile auth (login / register / refresh / reset) works
- Contractors and chat APIs work
- Expo Go on a physical device can reach the API

If you are working inside the Next.js repo, use this as your checklist, then refer to the detailed guides in `old_integrations/` for copy‑paste code.

---

## 1. Locate the Next.js Project

Your Expo app lives here:

- `react-native/nativebnbsos`  ← Expo / React Native

The Next.js backend (with Better Auth) is a **separate project** (for example under `bnbsos/next-auth/next-auth`).  
All changes in this file refer to that **Next.js project**, not the Expo app.

---

## 2. Required Environment Variables (Next.js)

In the **Next.js** project’s `.env.local` set at least:

```env
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=your-strong-jwt-secret-key
REFRESH_TOKEN_SECRET=your-strong-refresh-token-secret
DATABASE_URL=postgresql://...   # your existing DB URL
```

These values are used by:
- `lib/auth.ts` / Better Auth configuration
- `lib/jwt.ts` (JWT utilities used by mobile endpoints)

For a full list, see `old_integrations/BETTER_AUTH_INTEGRATION_SUMMARY.md` in this folder.

---

## 3. JWT Utilities (`lib/jwt.ts`)

Create `lib/jwt.ts` in the Next.js project using the implementation from:

- `old_integrations/NEXTJS_COMPLETE_IMPLEMENTATION.md` (recommended)
  - Provides `generateMobileToken`, `generateRefreshToken`,
    `verifyMobileToken`, `verifyRefreshToken` and shared helpers.

Every mobile API route in `/api/mobile/*` and the chat endpoints will import from this file, e.g.:

```ts
import { verifyMobileToken, generateMobileToken, generateRefreshToken } from "@/lib/jwt";
```

Without this file the Expo app cannot issue or verify the JWTs it sends.

---

## 4. Authentication Endpoints for Mobile

Implement the following endpoints in the **Next.js** `app` directory:

1. **Login**
   - `POST /api/mobile/auth/login`
   - File: `app/api/mobile/auth/login/route.ts`
   - Purpose: Authenticate with email/password, proxy Better Auth, return:
     - `user`
     - `token` (access token for mobile)
     - `refreshToken`

2. **Register**
   - `POST /api/mobile/auth/register`
   - File: `app/api/mobile/auth/register/route.ts`
   - Purpose: Create user, return same shape as login.

3. **Refresh Access Token (CRITICAL)**
   - `POST /api/mobile/auth/refresh`
   - File: `app/api/mobile/auth/refresh/route.ts`
   - Uses `verifyRefreshToken` / `generateMobileToken` / `generateRefreshToken`.
   - This is required by `authapi.tsx` when tokens expire.
   - A full implementation is already written in `QUICK_START.md` (Step 4) and
     in `old_integrations/NEXTJS_COMPLETE_IMPLEMENTATION.md`.

4. **Password Reset (optional but recommended)**
   - `POST /api/mobile/auth/reset-password` (request)
   - `PATCH /api/mobile/auth/reset-password` (complete)
   - Files:
     - `app/api/mobile/auth/reset-password/route.ts`

5. **Session Endpoint**
   - `GET /api/auth/session`
   - File: `app/api/auth/session/route.ts`
   - Used by `getSession()` in the Expo `authapi.tsx` to restore the user.

All of these endpoints, including full code, are documented in:
- `old_integrations/NEXTJS_COMPLETE_IMPLEMENTATION.md`
- Minimal critical versions in `old_integrations/NEXTJS_IMPLEMENTATION_NOW.md`

---

## 5. Contractors Endpoint

The Expo app calls `getContractorsByLocationAndProfession()` in `authapi.tsx`, which expects:

- `GET /api/mobile/contractors`
- File: `app/api/mobile/contractors/route.ts`
- Query parameters:
  - `location` – user’s location string (may be empty)
  - `profession` – comma separated list of professions

The endpoint should:
- Read and verify the mobile JWT from `Authorization: Bearer <token>`
- Query the `Contractor` model with Prisma
- Return a list of contractors matching the expected shape in `Contractor` type

See the “Contractors API” section in `old_integrations/NEXTJS_MISSING_ENDPOINTS.md`
or the full code in `NEXTJS_COMPLETE_IMPLEMENTATION.md`.

---

## 6. Chat / Conversations Endpoints

The Expo chat screens rely on a set of `/api/mobile/chat/*` endpoints.  
At minimum you should implement:

1. `GET /api/mobile/chat/conversations`
2. `GET /api/mobile/chat/conversations/[id]`
3. `POST /api/mobile/chat/conversations`
4. `GET /api/mobile/chat/contacts/with-conversations`
5. `GET /api/mobile/chat/unread-count`
6. `POST /api/mobile/chat/messages`
7. `DELETE /api/mobile/chat/messages/[id]`

Each:
- Lives under `app/api/mobile/chat/...`
- Uses `verifyMobileToken` to identify the current user
- Queries `Conversation` and `Chat` tables via Prisma
- Returns the shapes documented in `api/chatapi.tsx` and
  `nextjs-integration/old_integrations/NEXTJS_MISSING_ENDPOINTS.md`

For the **easiest path**, follow `NEXTJS_START_HERE.md`:
- Open `NEXTJS_COMPLETE_IMPLEMENTATION.md`
- Copy each chat endpoint into the indicated file path

---

## 7. CORS Headers for Mobile Routes

Every `/api/mobile/*` route must respond to `OPTIONS` with permissive CORS in development, and include appropriate headers on `GET/POST/PATCH` responses.

Basic pattern:

```ts
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

All example endpoints in `NEXTJS_COMPLETE_IMPLEMENTATION.md` already include this.
When you copy them into your Next.js app, CORS will be configured correctly.

---

## 8. Make the Dev Server Reachable from Expo Go

Once endpoints exist, the Expo app must be able to reach them from the phone.

On the **Next.js** project, run dev like this:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

This binds the server on all interfaces so the Expo app (using
`EXPO_PUBLIC_BASE_URL=http://YOUR_MAC_IP:3000` in its `.env.local`)
can reach it over Wi‑Fi.

You can test from the phone’s browser:

```text
http://YOUR_MAC_IP:3000/api/mobile/auth/login
```

---

## 9. Final Checklist for Next.js (Expo Go Ready)

- [ ] `.env.local` contains `BETTER_AUTH_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DATABASE_URL`
- [ ] `lib/jwt.ts` created with helper functions from the integration docs
- [ ] `/api/mobile/auth/login` implemented
- [ ] `/api/mobile/auth/register` implemented
- [ ] `/api/mobile/auth/refresh` implemented (**critical**)
- [ ] `/api/mobile/auth/reset-password` endpoints implemented (optional)
- [ ] `/api/auth/session` implemented
- [ ] `/api/mobile/contractors` implemented
- [ ] Core `/api/mobile/chat/*` endpoints implemented
- [ ] All `/api/mobile/*` endpoints include CORS headers
- [ ] Next.js dev server started with `--hostname 0.0.0.0`

Once all of the above are in place, the Expo app running in **Expo Go**
can use the same API surface as the web frontend, and the login,
contractor search, and chat flows will work end‑to‑end.


