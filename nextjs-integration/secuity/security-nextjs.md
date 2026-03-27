# Security Remediation — Next.js Backend

**Date:** 2026-03-26 (updated 2026-03-27)
**Companion to:** `security.md` (client-side audit)
**Scope:** Next.js backend that `nativebnbsos` connects to (Better Auth + Prisma)
**Priority order:** C → H → M → Hardening

---

## Implementation Status

| Item | Status | File(s) changed |
|---|---|---|
| CORS middleware | ✅ Implemented | `middleware.ts` |
| CORS on auth routes | ✅ Implemented | 6 route files (see below) |
| CORS on shared auth helper | ✅ Implemented | `lib/mobile-auth.ts` |
| Health check route | ✅ Implemented | `app/api/mobile/health/route.ts` |
| Login — DB refresh tokens (M-4) | ✅ Implemented | `app/api/mobile/auth/login/route.ts` |
| Login — rate limiting (M-6) | ✅ Implemented | `app/api/mobile/auth/login/route.ts` |
| Login — platform detection (H-1) | ✅ Implemented | `app/api/mobile/auth/login/route.ts` |
| Refresh token rotation (M-4) | ✅ Implemented | `app/api/mobile/auth/refresh/route.ts` |
| Logout — server-side revocation (M-5) | ✅ Implemented | `app/api/mobile/auth/logout/route.ts` |
| Audit logging | ✅ Implemented | `lib/auditLog.ts` + login route |
| Security headers | ✅ Implemented | `next.config.js` |
| C-1 / C-2 / C-3 — Chat/role identity | ⏳ Pending | See checklist |

---

## Table of Contents

0. [CORS — What Was Implemented](#cors--what-was-implemented)
1. [C-1 — Fix Sender Identity in Chat Routes](#c-1--fix-sender-identity-in-chat-routes)
2. [C-2 — Remove receiver_id Dependency in Reply Route](#c-2--remove-receiver_id-dependency-in-reply-route)
3. [C-3 — Server-side Role Verification on Contractor Endpoints](#c-3--server-side-role-verification-on-contractor-endpoints)
4. [H-1 — HttpOnly Cookies for Web Clients](#h-1--httponly-cookies-for-web-clients)
5. [M-4 — Refresh Token Rotation & Revocation](#m-4--refresh-token-rotation--revocation)
6. [M-5 — Server-side Session Invalidation on Logout](#m-5--server-side-session-invalidation-on-logout)
7. [M-6 — Rate Limiting on Login Endpoint](#m-6--rate-limiting-on-login-endpoint)
8. [Hardening — Headers, Audit Logging, CI](#hardening--headers-audit-logging-ci)
9. [Remediation Checklist](#remediation-checklist)

---

## CORS — What Was Implemented

✅ **Status: Implemented and verified working**

### Root causes that were fixed

Three separate bugs prevented CORS from working, all requiring fixes at the same time:

| Bug | Location | Fix |
|---|---|---|
| `import { auth } from "@/auth"` crashed Edge Runtime silently | `middleware.ts` | Removed — middleware now loads cleanly |
| `Access-Control-Allow-Headers` missing `X-Client-Platform` | `middleware.ts` | Added |
| Origin hardcoded to `http://localhost:8081` — rejected LAN IPs and all other origins | `middleware.ts` | `ALLOWED_ORIGINS_DEV = true` → sends `*` in dev |
| `X-Client-Platform` missing from `Access-Control-Allow-Headers` in every route | 6 route files | Fixed in all auth + switch-role routes |
| `addCorsHeaders()` helper missing `X-Client-Platform` | `lib/mobile-auth.ts` | Fixed |

### Implemented: `middleware.ts` (project root)

The existing `middleware.ts` was rewritten. Key changes:
- Removed the `import { auth } from "@/auth"` that was crashing the Edge Runtime
- Simplified CORS to a single `withCors()` function
- `ALLOWED_ORIGINS_DEV = true` → sends `Access-Control-Allow-Origin: *` in development
- `X-Client-Platform` added to `Access-Control-Allow-Headers`
- All API paths (`/api/chat`, `/api/auth`, `/api/mobile`, `/api/stripe`, `/api/geo`, `/api/user`, `/api/contractors`) are handled

```typescript
//middleware.ts

import createMiddleware from "next-intl/middleware";
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, isPublicRoute, isAuthRoute } from "@/routes";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

// Set to false in production and populate PROD_ORIGINS below
const ALLOWED_ORIGINS_DEV = true;
const PROD_ORIGINS: string[] = [
  // "https://your-app.example.com",
];

const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_ALLOW_HEADERS =
  "Content-Type, Authorization, X-Client-Platform, X-Requested-With";

const intlMiddleware = createMiddleware(routing);

function withCors(response: NextResponse, origin: string): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS_DEV ? "*" : origin);
  response.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
  response.headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export async function middleware(req: NextRequest, ctx: any) {
  const requestOrigin = req.headers.get("origin") ?? "";

  const isCorsRoute =
    req.nextUrl.pathname.startsWith("/api/chat") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/api/mobile") ||
    req.nextUrl.pathname.startsWith("/api/stripe") ||
    req.nextUrl.pathname.startsWith("/api/geo") ||
    req.nextUrl.pathname.startsWith("/api/user") ||
    req.nextUrl.pathname.startsWith("/api/contractors");

  if (isCorsRoute) {
    if (req.method === "OPTIONS") {
      return withCors(new NextResponse(null, { status: 204 }), requestOrigin);
    }
    return withCors(NextResponse.next(), requestOrigin);
  }

  // Page routes — handled by next-intl + session cookie check
  // ... (unchanged from original)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Route-level CORS fixes (belt-and-suspenders)

`X-Client-Platform` was added to `Access-Control-Allow-Headers` in every auth route that had its own inline CORS headers:

| Route file | Change |
|---|---|
| `app/api/mobile/auth/login/route.ts` | Added `X-Client-Platform` |
| `app/api/mobile/auth/refresh/route.ts` | Added `X-Client-Platform` |
| `app/api/mobile/auth/logout/route.ts` | Added `X-Client-Platform` |
| `app/api/mobile/auth/register/route.ts` | Added `X-Client-Platform` |
| `app/api/auth/session/route.ts` | Added `X-Client-Platform` |
| `app/api/auth/switch-role/route.ts` | Added `X-Client-Platform` |

### Shared helper fix: `lib/mobile-auth.ts`

`addCorsHeaders()` (used by chat route OPTIONS handlers) updated:

```typescript
export function addCorsHeaders(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  // X-Client-Platform must be listed — Expo sends it on every request
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Platform");
  headers.set("Access-Control-Max-Age", "86400");
}
```

### Health check route: `app/api/mobile/health/route.ts` (new)

Zero-dependency GET route for connectivity testing — no auth, no DB:

```typescript
export async function GET() {
  return NextResponse.json({ ok: true, timestamp: Date.now() });
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Platform",
    },
  });
}
```

Test with: `curl http://localhost:3000/api/mobile/health`

### Production checklist for CORS

- [ ] Set `ALLOWED_ORIGINS_DEV = false` in `middleware.ts`
- [ ] Populate `PROD_ORIGINS` with your actual domain(s)
- [ ] Never use `Access-Control-Allow-Origin: *` in production when `Authorization` headers are sent

---

---

## C-1 — Fix Sender Identity in Chat Routes

**Affected routes:**
- `POST /api/chat/messages`
- `POST /api/chat/conversations`

**Problem:** The mobile client currently sends `sender_id` and `userId` in the request body. If the server trusts these values it is a full IDOR — any authenticated user can forge messages as any other user.

**Fix:** Never accept identity fields from the request body. Derive sender identity exclusively from the verified session.

### `POST /api/chat/messages` — send/reply

```typescript
// app/api/chat/messages/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Verify session — reject if unauthenticated
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // 2. NEVER read sender_id from body — always use session
  const senderId = session.user.id; // ← enforced server-side

  // 3. Validate required fields (conversationId OR receiverId required)
  const { conversationId, receiverId, text, subject } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "text exceeds 5000 characters" }, { status: 400 });
  }

  // 4. If replying to an existing conversation, verify the caller is a participant
  if (conversationId) {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, Contractor: { select: { uid: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const contractorUserId = conversation.Contractor?.uid;
    const isParticipant =
      conversation.userId === session.user.id ||
      contractorUserId === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 5. Create message — sender_id comes from session, NOT body
  const message = await db.chat.create({
    data: {
      text: text.trim(),
      sender_id: senderId,                      // ← from JWT
      conversationId: conversationId ?? null,
      subject: subject ?? "New Message",
      // receiver_id is no longer stored; derive from conversation participants
    },
  });

  return NextResponse.json(message, { status: 201 });
}
```

### `POST /api/chat/conversations` — create conversation

```typescript
// app/api/chat/conversations/route.ts
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // NEVER trust userId from body — use session
  const userId = session.user.id; // ← enforced server-side

  const { contractorId, subject } = body;

  if (!contractorId || typeof contractorId !== "number") {
    return NextResponse.json({ error: "contractorId is required" }, { status: 400 });
  }

  // Verify contractor exists
  const contractor = await db.contractor.findUnique({ where: { id: contractorId } });
  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  }

  const conversation = await db.conversation.create({
    data: {
      userId,            // ← from session, not body
      contractorId,
      subject: subject ?? "New Conversation",
    },
    include: { Contractor: true, User: true, Chat: true },
  });

  return NextResponse.json(conversation, { status: 201 });
}
```

**Key rule:** Remove any `sender_id`, `userId`, `user_id` fields from the Prisma `create` call that come from `body`. If these fields are in the request body today, strip them out before insertion.

---

## C-2 — Remove receiver_id Dependency in Reply Route

**Affected route:** `POST /api/chat/messages` (reply path, when `conversationId` is present)

**Problem:** The mobile client sends `receiver_id: "placeholder"`. If the server performs any logic on this field (notification routing, access control, ownership lookup) it will silently fail or be bypassable.

**Fix:** When a `conversationId` is provided, look up the conversation participants from the database and derive the receiver from there. Never use a client-supplied `receiver_id` for authorization or routing logic.

```typescript
// In POST /api/chat/messages — reply path
if (conversationId) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      User: { select: { id: true } },
      Contractor: { select: { uid: true, id: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Derive the actual receiver — the other participant
  const senderIsUser = conversation.userId === session.user.id;
  const senderIsContractor = conversation.Contractor?.uid === session.user.id;

  if (!senderIsUser && !senderIsContractor) {
    return NextResponse.json({ error: "Forbidden: not a participant" }, { status: 403 });
  }

  // The actual receiver is the other party — used for notifications only,
  // not for access control (access control is the participant check above)
  const actualReceiverId = senderIsUser
    ? conversation.Contractor?.uid     // ← from DB
    : conversation.userId;             // ← from DB

  // Use actualReceiverId for push notification routing if needed
  // Do NOT store receiver_id sent by client
}
```

**Remove** any logic that reads `body.receiver_id` for anything other than optionally accepting a `startMessage` receiver when no `conversationId` exists yet (new conversation creation). Even in that case, verify the receiver is an existing user in the database.

---

## C-3 — Server-side Role Verification on Contractor Endpoints

**Affected routes:** All endpoints under `/api/chat/timeslot/*`, `/api/contractors/*` (mutating), `/api/auth/switch-role`

**Problem:** The mobile app stores `isContractor` locally and the `ContractorRouteGuard` only checks the local value. If a server endpoint trusts a client-supplied role claim it is a role escalation.

### Rule: Every contractor-gated endpoint must re-verify from the session JWT

```typescript
// Shared helper — lib/requireContractor.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function requireContractor(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Re-verify from database — never trust client-supplied isContractor
  const contractor = await db.contractor.findFirst({
    where: { uid: session.user.id },
    select: { id: true, confirmed: true },
  });

  if (!contractor || !contractor.confirmed) {
    return { error: NextResponse.json({ error: "Forbidden: not a confirmed contractor" }, { status: 403 }) };
  }

  return { session, contractor };
}
```

Usage in a contractor-only route:

```typescript
// app/api/chat/timeslot/approve/route.ts
export async function POST(req: NextRequest) {
  const { session, contractor, error } = await requireContractor(req);
  if (error) return error;

  // contractor.id is DB-verified, not from body
  const body = await req.json();
  const { startTime, endTime, chatId } = body;

  // Do NOT use body.contractorId — use contractor.id from DB
  const slot = await db.availabilitySlot.create({
    data: {
      contractorId: contractor.id,   // ← from DB, not from body
      startTime,
      endTime,
    },
  });
  // ...
}
```

### Fix `/api/auth/switch-role`

The switch-role endpoint must verify the user has an actual contractor record before allowing the switch:

```typescript
// app/api/auth/switch-role/route.ts
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();

  if (role === "contractor") {
    // Verify the user actually has a confirmed contractor record
    const contractor = await db.contractor.findFirst({
      where: { uid: session.user.id, confirmed: true },
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "No confirmed contractor profile found", code: "NO_CONTRACTOR_PROFILE" },
        { status: 403 }
      );
    }
  }

  // Proceed with role switch (update session / return new token)
  // ...
}
```

---

## H-1 — HttpOnly Cookies for Web Clients

✅ **Status: Implemented on the Next.js side (platform detection + cookie issuance)**

⚠️ **Important update:** The Expo app was changed to always send `X-Client-Platform: mobile` regardless of `Platform.OS`. This is because the Expo app is always a mobile-first client (even when running as web) and requires JWT tokens in the response body — it cannot read HttpOnly cookies cross-origin. The HttpOnly cookie path in the login route remains in place for true web browser clients (e.g. a standard Next.js web app).

### What was implemented

The login route (`app/api/mobile/auth/login/route.ts`) reads `X-Client-Platform` and branches:

```typescript
const platform = req.headers.get("x-client-platform") ?? "web";
const isMobile = platform === "mobile";

// ...generate tokens...

if (isMobile) {
  // Expo app: return JWT tokens in body → stored in expo-secure-store
  return withCors(new NextResponse(JSON.stringify({
    ...resBody,
    token: accessToken,
    refreshToken: rawRefreshToken,
    loginAs: effectiveLoginAs,
    user: userResponse,
  }), { status: 200 }));
} else {
  // Standard web browser: HttpOnly cookies — tokens never exposed to JS
  const response = new NextResponse(JSON.stringify({
    ...resBody,
    loginAs: effectiveLoginAs,
    user: userResponse,
    // token/refreshToken intentionally omitted from body
  }), { status: 200 });

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,       // 15 minutes
    path: "/",
  });
  response.cookies.set("refresh_token", rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,   // 7 days
    path: "/api/mobile/auth/refresh",
  });
  return withCors(response);
}
```

### Expo app change (cross-reference)

In `api/authapi.tsx` and `utils/authenticatedFetch.ts`, `X-Client-Platform` is now always `"mobile"`:

```typescript
// Always "mobile" — Expo is a mobile-first app even when running as web.
// Sending "web" causes the server to issue HttpOnly cookies which Expo
// cannot read or send cross-origin, breaking all authenticated API calls.
"X-Client-Platform": "mobile",
```

### Content-Security-Policy

✅ Added in `next.config.js` (see Hardening section). The active CSP allows both `https:` and `http:` in `connect-src` for development (LAN access).

---

## M-4 — Refresh Token Rotation & Revocation

**Problem:** A stolen refresh token grants 30 days of persistent access (now reduced to 7 days on the client, but still long). Without rotation, a stolen token remains valid for its full lifetime even after the legitimate user logs out.

### Option A: Better Auth built-in token families (recommended)

If you are using Better Auth's JWT plugin with `refreshToken` support, enable token family rotation:

```typescript
// lib/auth.ts (Next.js)
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      jwt: {
        expirationTime: "5m",       // access token (updated from 20s)
      },
      refreshToken: {
        expirationTime: "7d",       // reduced from 30d
        rotateOnUse: true,          // ← invalidate old refresh token on each use
        reuseDetection: true,       // ← if an already-used token is presented, revoke entire family
      },
    }),
  ],
});
```

### Option B: Manual rotation with Prisma (if not using Better Auth JWT plugin)

```typescript
// app/api/mobile/auth/refresh/route.ts
export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
  }

  // 1. Look up the refresh token in the DB
  const storedToken = await db.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // 2. Check for token reuse (family violation)
  if (storedToken.used) {
    // Potential token theft — revoke entire family
    await db.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revoked: true },
    });
    return NextResponse.json(
      { error: "Refresh token already used. All sessions invalidated." },
      { status: 401 }
    );
  }

  // 3. Check expiry
  if (storedToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
  }

  // 4. Check revocation
  if (storedToken.revoked) {
    return NextResponse.json({ error: "Refresh token revoked" }, { status: 401 });
  }

  // 5. Mark old token as used (rotation)
  await db.refreshToken.update({
    where: { id: storedToken.id },
    data: { used: true },
  });

  // 6. Issue new token pair
  const newAccessToken = signAccessToken(storedToken.user);
  const newRefreshToken = await db.refreshToken.create({
    data: {
      token: generateSecureToken(),
      userId: storedToken.userId,
      familyId: storedToken.familyId,    // same family for reuse detection
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    token: newAccessToken,
    refreshToken: newRefreshToken.token,
    user: storedToken.user,
  });
}
```

### Prisma schema addition (Option B)

```prisma
model RefreshToken {
  id         String   @id @default(cuid())
  token      String   @unique
  userId     String
  familyId   String   // groups all rotated tokens from one login
  used       Boolean  @default(false)
  revoked    Boolean  @default(false)
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
}
```

---

## M-5 — Server-side Session Invalidation on Logout

**Affected route:** `POST /api/auth/sign-out`

**Problem:** If the server does not actively invalidate the refresh token on logout, a stolen refresh token can be replayed until it naturally expires (now 7 days with the updated constant).

### Fix

```typescript
// app/api/auth/sign-out/route.ts
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (session?.user) {
    // Option A (Better Auth JWT plugin): call built-in revoke
    await auth.api.revokeSession({ headers: req.headers });

    // Option B (manual): revoke all refresh tokens for this user
    await db.refreshToken.updateMany({
      where: { userId: session.user.id, revoked: false },
      data: { revoked: true },
    });

    // Audit log
    console.info(`[AUTH] User ${session.user.id} signed out at ${new Date().toISOString()}`);
  }

  // Clear cookies (for web clients)
  const response = NextResponse.json({ success: true });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}
```

The mobile client's `authapi.tsx` already calls this endpoint with the Bearer token, so the `getSession` call will resolve the user from the JWT header.

---

## M-6 — Rate Limiting on Login Endpoint

**Affected route:** `POST /api/mobile/auth/login`

**Problem:** No server-side rate limiting means a motivated attacker can brute-force passwords even from a real device, bypassing any app-transport checks.

### Option A: `@upstash/ratelimit` with Redis (recommended for production)

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 attempts per minute per key
  analytics: true,
});
```

```typescript
// app/api/mobile/auth/login/route.ts
import { loginRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const body = await req.json();

  // Rate limit per IP AND per email (belt-and-suspenders)
  const ipKey = `login_ip:${ip}`;
  const emailKey = `login_email:${body.email?.toLowerCase() ?? "unknown"}`;

  const [ipResult, emailResult] = await Promise.all([
    loginRateLimit.limit(ipKey),
    loginRateLimit.limit(emailKey),
  ]);

  if (!ipResult.success || !emailResult.success) {
    const resetAt = Math.max(ipResult.reset, emailResult.reset);
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(Math.min(ipResult.remaining, emailResult.remaining)),
        },
      }
    );
  }

  // ... rest of login logic
}
```

### Option B: In-memory rate limiting (development / low-traffic)

```typescript
// lib/rateLimitMemory.ts
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= maxAttempts) {
    return false; // blocked
  }

  record.count++;
  return true; // allowed
}
```

**Note:** Option B is not suitable for multi-instance deployments. Use Option A (Redis-backed) for any production environment.

---

## Hardening — Headers, Audit Logging, CI

### Security Headers in `next.config.js`

```javascript
// next.config.js
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Audit Logging

Add structured audit logs on every auth event:

```typescript
// lib/auditLog.ts
type AuditEvent =
  | "login_success"
  | "login_failure"
  | "logout"
  | "token_refresh"
  | "role_switch"
  | "token_reuse_detected"
  | "rate_limit_hit";

interface AuditEntry {
  event: AuditEvent;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function auditLog(entry: AuditEntry) {
  // In production: send to your logging service (e.g. Datadog, Logtail, CloudWatch)
  // For development: structured console output
  console.info(JSON.stringify({ audit: true, ...entry }));
}
```

Usage in the login route:

```typescript
// On successful login
auditLog({ event: "login_success", userId: user.id, ip, timestamp: new Date().toISOString() });

// On failed login (do NOT log password or full credentials)
auditLog({ event: "login_failure", email: body.email, ip, timestamp: new Date().toISOString() });

// On rate limit hit
auditLog({ event: "rate_limit_hit", ip, email: body.email, timestamp: new Date().toISOString() });
```

### CI/CD Security Scanning

Add to your CI pipeline (e.g. GitHub Actions):

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - name: npm audit
        run: npm audit --audit-level=high
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

---

## Remediation Checklist

Use this checklist alongside the Expo client checklist in `security.md`.

### Before Production Launch (Blockers)

- [ ] **C-1** `/api/chat/messages` POST: strip `sender_id`/`userId` from body processing; derive `senderId = session.user.id`
- [ ] **C-1** `/api/chat/conversations` POST: strip `userId` from body; derive `userId = session.user.id`
- [ ] **C-2** `/api/chat/messages` POST (reply path): look up `conversationId` participants in DB; verify caller is a participant; do not use `receiver_id` from body for authorization
- [ ] **C-3** All contractor-only routes: add `requireContractor()` helper call; verify contractor record in DB, not from any client-supplied field
- [ ] **C-3** `/api/auth/switch-role`: verify `db.contractor.findFirst({ where: { uid: session.user.id, confirmed: true } })` before allowing switch to contractor role

### Before First External User (High Priority)

- [x] **H-1** `/api/mobile/auth/login`: detects `X-Client-Platform` header; issues `HttpOnly; SameSite=Strict` cookies for web clients, JWT tokens in body for mobile clients ✅
- [x] **H-1** `Content-Security-Policy` header added in `next.config.js` ✅
- [x] **M-4** DB-backed refresh token rotation with `familyId` reuse detection — `RefreshToken` table in Prisma ✅
- [x] **M-4** Refresh token lifetime is `7d` in `lib/jwt.ts` ✅
- [x] **M-5** `/api/mobile/auth/logout` actively revokes all refresh tokens for the user (DB update); clears auth cookies ✅
- [x] **M-6** Rate limiting on `/api/mobile/auth/login`: 5 attempts / 60 s per IP and per email via `lib/rateLimitMemory.ts` ✅

### Hardening (Ongoing)

- [x] Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.js` ✅
- [x] Structured audit logging (`lib/auditLog.ts`) for login success/failure, logout, rate limit hit ✅
- [ ] Add `npm audit --audit-level=high` and secret scanning to CI pipeline
- [ ] Review all Prisma queries in chat and contractor routes for missing `where: { userId: session.user.id }` ownership filters (prevent horizontal privilege escalation)
- [ ] Ensure `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` are never logged and are rotated on a schedule
- [ ] Set `ALLOWED_ORIGINS_DEV = false` in `middleware.ts` before production deploy; populate `PROD_ORIGINS`

---

*Last updated: 2026-03-27 — companion document to `security.md`*
