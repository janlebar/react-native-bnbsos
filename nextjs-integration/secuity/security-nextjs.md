# Security Remediation — Next.js Backend

**Date:** 2026-03-26
**Companion to:** `security.md` (client-side audit)
**Scope:** Next.js backend that `nativebnbsos` connects to (Better Auth + Prisma)
**Priority order:** C → H → M → Hardening

---

## Table of Contents

0. [CORS — Required for Expo Web Dev (Fix First)](#cors--required-for-expo-web-dev-fix-first)
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

## CORS — Required for Expo Web Dev (Fix First)

**Symptom:**
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
at http://192.168.1.131:3000/api/mobile/auth/login.
(Reason: CORS request did not succeed). Status code: (null).
```

**Root cause:** The Expo web app is served from `http://192.168.1.131:8081` (Expo dev server) and makes API calls to `http://192.168.1.131:3000` (Next.js). These are **different origins** (different ports). The browser enforces the Same-Origin Policy and blocks all cross-origin requests unless the Next.js server explicitly allows them via `Access-Control-Allow-*` response headers.

`Status code: (null)` means the browser rejected the request at the network level — the request **never reached Next.js**. This is why the Next.js terminal shows no incoming requests.

**Note:** This is different from the Content-Security-Policy `connect-src` change. CSP controls what a Next.js-served page can fetch. CORS controls what other origins (like the Expo dev server) can fetch from Next.js. Both are needed.

### Fix — Add CORS middleware to Next.js

**Option A (recommended): `middleware.ts` at project root**

This handles CORS for all `/api/*` routes in one place, including preflight `OPTIONS` requests which browsers send before `POST`, `PUT`, or `DELETE` with custom headers.

```typescript
// middleware.ts (project root — next to package.json)
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? [
      // Add your production Expo web origin here if applicable
      // e.g. "https://your-app.example.com"
    ]
  : [
      // Development: allow all local and LAN origins
      // Add your Expo dev server address here
      "http://localhost:8081",
      "http://localhost:19006",
      "http://192.168.1.131:8081",   // ← your LAN IP + Expo port
      "http://192.168.1.131:19006",
      // Wildcard approach for dev (simpler but less precise):
      // Use allowAll = true below instead
    ];

const ALLOW_ALL_IN_DEV = process.env.NODE_ENV !== "production";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": [
    "Content-Type",
    "Authorization",
    "X-Client-Platform",   // required by mobile auth protocol
    "X-Requested-With",
  ].join(", "),
  "Access-Control-Max-Age": "86400", // cache preflight for 24 h
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = ALLOW_ALL_IN_DEV || ALLOWED_ORIGINS.includes(origin);

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", ALLOW_ALL_IN_DEV ? "*" : origin);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Pass through to the actual route handler
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", ALLOW_ALL_IN_DEV ? "*" : origin);
  }
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: "/api/:path*",  // only run on API routes
};
```

**After creating `middleware.ts`, restart the Next.js dev server.** Middleware changes require a full restart.

**Option B: `next.config.js` headers (simpler, but doesn't handle OPTIONS preflight for POST)**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Client-Platform" },
        ],
      },
    ];
  },
};
```

> **Limitation of Option B:** `next.config.js` headers do NOT handle `OPTIONS` preflight requests — browsers send an OPTIONS request before POST with `Content-Type: application/json` or custom headers. Without an OPTIONS handler, login will still fail. **Use Option A (middleware) for full coverage.**

### Production note

In production, set `ALLOWED_ORIGINS` to your specific domains and remove `ALLOW_ALL_IN_DEV = true`. Never allow `*` in production when `Authorization` headers are used.

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

**Problem:** When the Expo app runs as a web build, tokens are stored in `sessionStorage` (after the client-side fix). The proper fix is to have the server issue `HttpOnly` session cookies for web clients so tokens are never accessible to JavaScript at all.

**Detection:** The mobile client sends a custom header `X-Client-Platform: mobile` (you should add this to the Expo Axios instance). Alternatively, detect the `User-Agent` or accept a query param `?platform=mobile`.

### Strategy

For **mobile** (iOS/Android):
- Continue issuing JWT tokens in the response body (`{ token, refreshToken }`)
- These are stored in `expo-secure-store` (hardware-backed)

For **web** (`Platform.OS === "web"`):
- Issue a `HttpOnly; SameSite=Strict; Secure` session cookie
- Do NOT include the token in the response body
- The browser will automatically send the cookie on every same-origin request

### Implementation

```typescript
// app/api/mobile/auth/login/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const platform = req.headers.get("X-Client-Platform") ?? "web";

  // ... authenticate with Better Auth ...
  const { user, token, refreshToken } = await authenticateUser(body);

  if (platform === "mobile") {
    // Mobile: return tokens in body for SecureStore
    return NextResponse.json({ user, token, refreshToken });
  } else {
    // Web: set HttpOnly cookies, return only user (no tokens in body)
    const response = NextResponse.json({ user });
    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 300, // 5 minutes (matches updated access token expiry)
      path: "/",
    });
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches updated refresh expiry)
      path: "/api/mobile/auth/refresh", // scope to refresh endpoint only
    });
    return response;
  }
}
```

Add the platform header to the Expo Axios instance (already handled in the client-side fix via `api/authapi.tsx`):

```typescript
// In the Axios request interceptor (Next.js reads this to decide cookie vs body)
config.headers["X-Client-Platform"] = Platform.OS === "web" ? "web" : "mobile";
```

### Content-Security-Policy

Add a strict CSP in `next.config.js` to mitigate XSS (which is the threat that makes sessionStorage risky):

```javascript
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",        // no unsafe-inline, no unsafe-eval
      "style-src 'self' 'unsafe-inline'",   // adjust if using styled-components
      "img-src 'self' data: https:",
      "connect-src 'self' https://your-api-domain.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

module.exports = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
};
```

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

- [ ] **H-1** `/api/mobile/auth/login`: detect `X-Client-Platform` header; issue `HttpOnly; SameSite=Strict` cookies for web clients instead of tokens in body
- [ ] **H-1** Add `Content-Security-Policy` header in `next.config.js` to mitigate XSS on web build
- [ ] **M-4** Enable `rotateOnUse: true` in Better Auth JWT plugin OR implement manual refresh token rotation table in Prisma with reuse detection
- [ ] **M-4** Reduce refresh token lifetime to `7d` in Better Auth / `lib/jwt.ts` (matches the updated client constant)
- [ ] **M-5** `/api/auth/sign-out`: actively revoke the refresh token (DB update or Better Auth `revokeSession`); clear auth cookies in response
- [ ] **M-6** Add rate limiting middleware to `/api/mobile/auth/login`: 5 attempts / 1 min per IP and per email; return `429` with `Retry-After` header

### Hardening (Ongoing)

- [ ] Add security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`) to `next.config.js`
- [ ] Add structured audit logging (`auditLog()`) for: login success/failure, logout, token refresh, role switch, rate limit hit, token reuse detection
- [ ] Add `npm audit --audit-level=high` and secret scanning to CI pipeline
- [ ] Review all Prisma queries in chat and contractor routes for missing `where: { userId: session.user.id }` ownership filters (prevent horizontal privilege escalation)
- [ ] Ensure `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` are never logged and are rotated on a schedule

---

*Last updated: 2026-03-26 — companion document to `security.md`*
