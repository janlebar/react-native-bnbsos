# Security Audit — BnbSos Native (Expo + Next.js + Better Auth)

**Date:** 2026-03-26  
**Scope:** Expo React Native client (`nativebnbsos`) → Next.js backend (Better Auth)  
**Auditor:** Senior Security Review  
**Classification:** Internal — Do not distribute

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication & Token Flow](#3-authentication--token-flow)
4. [Findings](#4-findings)
   - [CRITICAL](#critical)
   - [HIGH](#high)
   - [MEDIUM](#medium)
   - [LOW / INFORMATIONAL](#low--informational)
5. [Token & Storage Security Reference](#5-token--storage-security-reference)
6. [Remediation Checklist](#6-remediation-checklist)

---

## 1. Executive Summary

This audit covers the full client-side attack surface of the `nativebnbsos` Expo application, including its authentication flows, token storage, API communication layer, role management, and debug utilities. The analysis is grounded in the actual source code rather than theoretical threat models.

**3 Critical findings** require immediate remediation before any production deployment. Without fixing them, an attacker who gains a valid token can impersonate other users in chat, forge their sender identity, and potentially elevate their own contractor role client-side.

**4 High findings** create viable attack vectors in a live environment, particularly for web builds where tokens land in `localStorage` and for OAuth flows using a weak state parameter.

**6 Medium findings** reduce defence-in-depth and enable attackers to enumerate the system, abuse sessions, or inject unvalidated data.

**3 Low/Informational findings** represent hardening opportunities with no immediate exploitability.

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 4 |
| Medium | 6 |
| Low / Informational | 3 |
| **Total** | **16** |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Expo App (iOS / Android / Web)                             │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │  LoginForm   │   │  AuthContext  │   │  ChatService  │  │
│  │  OAuthFlow   │   │  (+ role      │   │  chatapi.tsx  │  │
│  │  lib/auth.ts │   │   override)   │   │               │  │
│  └──────┬───────┘   └──────┬────────┘   └───────┬───────┘  │
│         │                  │                    │           │
│         └──────────────────┴────────────────────┘          │
│                            │                               │
│              Bearer JWT (20 s) / Refresh (30 d)           │
│              stored in SecureStore (native)                │
│              stored in localStorage (web — RISK)           │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTPS (production)
                             │  HTTP localhost (dev — hardcoded)
┌────────────────────────────▼────────────────────────────────┐
│  Next.js Backend                                            │
│                                                             │
│  /api/mobile/auth/login     /api/mobile/auth/refresh        │
│  /api/auth/sign-out         /api/auth/session               │
│  /api/auth/switch-role      /api/chat/*                     │
│                                                             │
│  Better Auth middleware → validates Bearer token            │
│  Issues short-lived JWT (20 s) + refresh JWT (30 d)        │
└─────────────────────────────────────────────────────────────┘
```

**Key observation:** The client holds two JWTs in device storage. Every API call runs through an Axios interceptor (`api/authapi.tsx`) that injects the access token as a `Bearer` header and automatically exchanges the refresh token on a 401 response.

---

## 3. Authentication & Token Flow

```
User submits credentials
        │
        ▼
POST /api/mobile/auth/login
        │
        ▼
Better Auth verifies → issues { token (20s), refreshToken (30d) }
        │
        ▼
Client saves both tokens
  Native: expo-secure-store  ✅
  Web:    localStorage        ⚠️
        │
        ▼
Subsequent requests:
  Authorization: Bearer <token>
        │
   401 received?
   ┌────┴────┐
  YES       NO
   │         └── proceed
   ▼
POST /api/mobile/auth/refresh  { refreshToken }
        │
        ▼
New token pair saved → original request retried
        │
   Refresh fails?
        │
        ▼
deleteTokens() → user signed out
```

The token lifecycle implementation in `api/authapi.tsx` and `utils/authenticatedFetch.ts` is **duplicated** — two separate Axios instances with identical interceptors exist. This increases maintenance risk and means a security fix must be applied to both.

---

## 4. Findings

---

### CRITICAL

---

#### C-1 — Client-Provided Sender Identity in Chat (IDOR)

**File:** `api/chatapi.tsx` — `sendMessage()`, `createConversation()`, `replyToConversation()`  
**Risk:** Full Insecure Direct Object Reference. An authenticated user can send messages as any other user ID.

**Vulnerable code:**

```typescript
// sendMessage() — line 263-269
const messageData = {
  text: content,
  sender_id: senderId,      // ← comes from the caller, not the JWT
  receiver_id: receiverId,
  conversationId: conversationId,
  subject: "New Message",
};
```

```typescript
// createConversation() — line 283-287
const conversationData = {
  userId,          // ← passed in by the caller, not extracted from token
  contractorId,
  subject: subject || "New Conversation",
};
```

**Attack scenario:**  
Attacker logs in as User A, captures their token, then calls `sendMessage("userB-id", ...)`. If the Next.js route handler trusts `sender_id` from the body rather than extracting it from `req.auth.user`, every message in the database will show User B as sender.

**Fix — server side (Next.js route handler):**  
Never accept `sender_id`, `userId`, or any identity field from the request body. Derive identity exclusively from the verified session:

```typescript
// ✅ Correct server-side pattern
const session = await auth.api.getSession({ headers: req.headers });
if (!session?.user) return new Response("Unauthorized", { status: 401 });

const message = await db.chat.create({
  data: {
    text: body.text,
    sender_id: session.user.id,   // ← from JWT, not body
    conversationId: body.conversationId,
  },
});
```

**Fix — client side:**  
Remove `sender_id` and `userId` from all request payloads:

```typescript
// ✅ chatapi.tsx sendMessage() — only send what the server can't derive itself
const messageData = {
  text: content,
  receiver_id: receiverId,
  conversationId: conversationId,
  subject: "New Message",
};
```

---

#### C-2 — `receiver_id: "placeholder"` Bypasses Authorization

**File:** `api/chatapi.tsx` — `replyToConversation()` line 423-430  
**Risk:** Bypasses server-side ownership check; indicates the authorization model on the server side is broken for this path.

**Vulnerable code:**

```typescript
async replyToConversation(conversationId, senderId, text, subject) {
  const response = await api.post("/api/chat/messages", {
    conversationId,
    sender_id: senderId,
    text,
    subject: subject || "Reply",
    receiver_id: "placeholder",  // ← literal placeholder bypasses validation
  });
}
```

**Risk:** If the server performs any logic based on `receiver_id` (access control, notification routing, ownership) it will either crash, silently fail, or be circumventable. The comment "ignored when conversationId is present" suggests the server skips validation entirely when a `conversationId` is present — this is an untested assumption that must be verified and documented.

**Fix:**  
Remove `receiver_id` from the reply payload entirely. The server must look up the conversation's participants from the database using `conversationId` and verify the sender is a participant:

```typescript
// ✅ Server must enforce: session.user.id must be a participant in the conversation
const conversation = await db.conversation.findUnique({
  where: { id: body.conversationId },
  include: { participants: true },
});
if (!conversation.participants.find(p => p.userId === session.user.id)) {
  return new Response("Forbidden", { status: 403 });
}
```

---

#### C-3 — Client-Side Role Override is the Declared Source of Truth

**File:** `lib/auth-context.tsx` — `applyRoleOverride()`, lines 30-37  
**Risk:** Role elevation. A user who can write to `SecureStore` (rooted/jailbroken device, or via another app vulnerability) can set `activeRole = "contractor"` and the app will treat them as a contractor without server verification.

**Vulnerable code:**

```typescript
// lib/auth-context.tsx line 30-37
async function applyRoleOverride(user: User): Promise<User> {
  const activeRole = await getActiveRole();
  if (activeRole === null) {
    return user;
  }
  // ← locally-stored value overrides the server-verified JWT claim
  return { ...user, isContractor: activeRole === "contractor" };
}
```

The comment in the file reads: *"The local activeRole in SecureStore is the source of truth."* — this is architecturally incorrect from a security standpoint.

**Risk in context:** If any contractor-only server endpoint checks the JWT's `isContractor` claim, this local override is harmless. However, if the server derives contractor status from any field the client controls, or if `ContractorRouteGuard` / `useContractorAccess` is the only gate (it checks only local `user.isContractor`), this is a full role escalation.

**Fix:**  
The role override pattern is acceptable **only as a UI display optimisation**. It must never be the gate for sensitive API calls. The server must independently re-verify contractor status on every protected endpoint:

```typescript
// ✅ lib/auth-context.tsx — rename to clarify intent
async function applyDisplayRoleHint(user: User): Promise<User> {
  // This is ONLY a UI hint. Server always re-verifies role on protected routes.
  const activeRole = await getActiveRole();
  if (activeRole === null) return user;
  return { ...user, _displayIsContractor: activeRole === "contractor" };
}
```

The `ContractorRouteGuard` must not be the only protection — every contractor API call must require a server-side ownership + role check.

---

### HIGH

---

#### H-1 — Access Tokens Stored in `localStorage` on Web

**File:** `utils/secureStore.tsx` — `saveToken()`, `saveRefreshToken()`, `saveUserData()`, lines 20-28  
**Risk:** Any XSS vulnerability in the web build exposes the access token, refresh token, and full user object to an attacker.

**Vulnerable code:**

```typescript
export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);  // ← XSS-accessible
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);  // ✅ secure
  }
};
```

This pattern is repeated for `saveRefreshToken()`, `saveUserData()`, and `saveActiveRole()`.

**Fix:**  
For web, use `HttpOnly` session cookies managed by the Next.js backend. The Better Auth `expoClient` plugin is not designed for web — on `Platform.OS === "web"` the app should use the standard Better Auth cookie-based session. If a token must live client-side on web, use `sessionStorage` (tab-scoped, cleared on close) as a minimum improvement, and implement a strict Content-Security-Policy to mitigate XSS.

---

#### H-2 — Hardcoded HTTP URL in Production Code Paths

**Files:** `lib/auth-client.ts` line 22, `constants/index.ts` line 10, `utils/authenticatedFetch.ts` line 7  
**Risk:** Man-in-the-middle (MITM) attack. If the environment variable is not set, all traffic including tokens is sent in plaintext over HTTP.

**Vulnerable code:**

```typescript
// lib/auth-client.ts
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",  // ← no env var, always HTTP
  ...
});

// constants/index.ts
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";
```

If `EXPO_PUBLIC_BASE_URL` is accidentally omitted from the production `.env`, the app silently falls back to an HTTP localhost URL that will fail to connect — or worse, connect to an unexpected local server.

**Fix:**  
Fail loudly if the environment variable is missing in non-development builds. Enforce HTTPS at the constant level:

```typescript
// constants/index.ts
const rawUrl = process.env.EXPO_PUBLIC_BASE_URL;
if (!rawUrl && process.env.NODE_ENV === "production") {
  throw new Error("EXPO_PUBLIC_BASE_URL must be set in production");
}
export const BASE_URL = rawUrl || "http://localhost:3000";

// Warn loudly if HTTP is used outside development
if (BASE_URL.startsWith("http://") && process.env.NODE_ENV === "production") {
  console.error("SECURITY: BASE_URL is HTTP in production. Use HTTPS.");
}
```

Also fix the hardcoded URL in `lib/auth-client.ts`:

```typescript
// lib/auth-client.ts
import { BASE_URL } from "../constants";

export const authClient = createAuthClient({
  baseURL: BASE_URL,  // ✅ driven by environment variable
  ...
});
```

---

#### H-3 — Weak Cryptographic State in OAuth Flow

**File:** `lib/auth.ts` — `signInWithOAuth()` lines 83-87  
**Risk:** Predictable OAuth state parameter enables CSRF against the OAuth callback. An attacker who can observe or predict `Math.random()` output can forge the state and hijack the OAuth session.

**Vulnerable code:**

```typescript
const state = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  Math.random().toString(),   // ← Math.random() is NOT cryptographically secure
  { encoding: Crypto.CryptoEncoding.HEX }
);
```

`Math.random()` is a pseudo-random number generator seeded deterministically. Hashing a predictable value does not make it secure.

**Fix:**  
Use the cryptographically secure `Crypto.getRandomBytesAsync()`:

```typescript
import * as Crypto from "expo-crypto";

const randomBytes = await Crypto.getRandomBytesAsync(32);
const state = Buffer.from(randomBytes).toString("hex");
```

---

#### H-4 — Sensitive Data Logged to Console in Every Login

**File:** `api/authapi.tsx` — `login()` method, lines 101-119  
**Risk:** On physical devices, console logs are accessible via device debugging tools, crash reporters (e.g. Sentry, Crashlytics), and CI/CD log aggregators. Tokens, email addresses, and full API responses are logged on every login.

**Vulnerable code:**

```typescript
console.log("🔍 Login method - API_URL at runtime:", API_URL);
console.log("🔍 Login method - process.env.EXPO_PUBLIC_BASE_URL:", ...);
console.log("🔐 Attempting login to:", `${API_URL}/api/mobile/auth/login`);
console.log("📧 Email:", credentials.email);         // ← PII
console.log("👤 loginAs:", credentials.loginAs);
console.log("✅ Login response status:", response.status);
console.log("📦 Response data:", JSON.stringify(response.data, null, 2)); // ← may include tokens
console.log("🔑 Access token found in data.token");  // ← confirms token location
console.log("💾 Saving tokens to secure storage...");
```

**Fix:**  
Replace all production logs with a conditional debug logger. Remove all logs that could contain tokens or PII:

```typescript
// utils/logger.ts
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  debug: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// Never log: tokens, passwords, email addresses, full response bodies
```

---

### MEDIUM

---

#### M-1 — Debug and Test Screens Accessible in Production Build

**Files:** `app/test-api.tsx`, `app/test-better-auth.tsx`  
**Risk:** These screens are routable via Expo Router. Any user who navigates to `/test-api` or `/test-better-auth` can test live API connectivity, enumerate chat endpoints, and see API responses. Combined with the `ApiTestComponent` which renders raw JSON to screen, these are information disclosure endpoints.

`app/test-api.tsx` renders `<ApiTestComponent />` which calls:
- `chatService.testApiConnection()`
- `chatService.getContacts()`
- `chatService.getConversations()`
- `chatService.getContactsWithConversations()`

**Fix:**  
Remove both screens from the production build entirely. Use Expo's build profile system to strip them:

```typescript
// app/test-api.tsx
if (process.env.NODE_ENV === "production") {
  // Redirect away — this screen must not exist in production
  throw new Error("Test screen not available in production");
}
```

Better: use a custom Babel plugin or Metro config to tree-shake debug screens out of production bundles. At minimum, add route protection that blocks access unless `__DEV__` is true.

---

#### M-2 — `apiDebugger.tsx` Contains Hardcoded URLs and Sends Unauthenticated Requests

**File:** `utils/apiDebugger.tsx` — `testApiEndpoint()` lines 141-148  
**Risk:** Hardcoded `http://localhost:3000` is used for test calls that send `credentials: "include"` (cookies). In a staging or production build this leaks cookie credentials to localhost if unintentionally triggered.

**Vulnerable code:**

```typescript
const response = await fetch(`http://localhost:3000/api${endpoint}`, {
  method,
  headers: { "Content-Type": "application/json" },
  credentials: "include",   // ← sends all cookies to localhost:3000
  body: data ? JSON.stringify(data) : undefined,
});
```

**Fix:**  
This entire file should be excluded from production builds. If retained for development, replace the hardcoded URL:

```typescript
import { BASE_URL } from "../constants";
const response = await fetch(`${BASE_URL}/api${endpoint}`, { ... });
```

---

#### M-3 — No Input Validation or Sanitization on User-Supplied Data

**Files:** `api/chatapi.tsx`, `app/(auth)/settings.tsx`, `app/register.tsx`  
**Risk:** Without schema validation, the client sends whatever the user types directly to the server. This creates injection vectors (if the server is insufficiently hardened) and enables sending malformed payloads that crash the server.

No `zod`, `yup`, or any validation library is imported anywhere in the client codebase.

**Example — raw chat message sent with no sanitization:**

```typescript
// chatapi.tsx sendMessage() — content is raw user input
const messageData = {
  text: content,    // ← no length check, no character filtering
  ...
};
await api.post("/api/chat/messages", messageData);
```

**Fix:**  
Add Zod schemas at the API layer boundary:

```typescript
import { z } from "zod";

const sendMessageSchema = z.object({
  text: z.string().min(1).max(5000).trim(),
  receiver_id: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

// Before calling api.post():
const validated = sendMessageSchema.parse({ text: content, receiver_id: receiverId, conversationId });
await api.post("/api/chat/messages", validated);
```

---

#### M-4 — Refresh Token Lifetime is 30 Days with No Visible Rotation

**File:** `constants/index.ts` line 17  
**Risk:** A stolen refresh token grants 30 days of silent, persistent access. The client code does not implement refresh token rotation (returning a new refresh token with each use) beyond what Better Auth may handle internally.

```typescript
export const REFRESH_TOKEN_EXPIRY = "30d";        // ← very long-lived
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;
```

If the backend issues a new `refreshToken` on every `/api/mobile/auth/refresh` call and the old token is immediately invalidated, this risk is mitigated server-side. However, there is no client-side evidence this rotation is happening or that the old token is invalidated.

**Fix:**  
- Reduce refresh token lifetime to 7 days.  
- Ensure the Next.js backend invalidates the previous refresh token on every use (refresh token rotation).  
- On the client, always save the new `refreshToken` returned from the refresh endpoint (already done in `authapi.tsx` line 65 if `data.refreshToken` is present).  
- Implement absolute session expiry: after 30 days of refresh token issuance, force re-authentication regardless.

---

#### M-5 — Logout Does Not Confirm Server-Side Invalidation

**File:** `lib/auth-context.tsx` — `signOut()` lines 143-154  
**Risk:** The logout function catches server-side errors silently and always clears local state. If the server-side session invalidation fails (network error, server bug), the JWT remains valid until its natural expiry. For the 30-day refresh token, this is a significant window.

**Vulnerable code:**

```typescript
const signOut = async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.error("Logout API failed:", error);  // ← swallowed silently
  } finally {
    await deleteTokens();   // ← always clears local regardless of server result
    setUser(null);
  }
};
```

**Fix:**  
With short-lived access tokens (20 s), this is lower risk for access tokens. However, for the refresh token, the server must maintain a revocation list or use token families. Alert the user if server logout fails so they can be aware their session may still be active server-side:

```typescript
const signOut = async () => {
  let serverLogoutOk = false;
  try {
    await authService.logout();
    serverLogoutOk = true;
  } catch (error) {
    logger.error("Server-side logout failed:", error);
    // Optionally: alert user that session may remain active on other devices
  } finally {
    await deleteTokens();
    setUser(null);
  }
  return serverLogoutOk;
};
```

---

#### M-6 — No Client-Side Rate Limiting or Login Attempt Backoff

**File:** `components/LoginForm.tsx` — `handleLogin()`  
**Risk:** The login form has no client-side rate limiting, exponential backoff, or lockout after repeated failures. While the server should implement this, the absence of any client-side throttle allows trivially scripted brute-force attempts from a real device (bypassing app-transport checks).

**Fix:**  
Add exponential backoff on the client as a complementary measure:

```typescript
const [loginAttempts, setLoginAttempts] = useState(0);
const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

const handleLogin = async () => {
  if (lockedUntil && new Date() < lockedUntil) {
    const secs = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
    Alert.alert("Too many attempts", `Please wait ${secs} seconds before trying again.`);
    return;
  }
  // ... login logic ...
  // On failure:
  const newAttempts = loginAttempts + 1;
  setLoginAttempts(newAttempts);
  if (newAttempts >= 5) {
    // Lock for 2^(attempts-5) minutes, max 30 minutes
    const lockMinutes = Math.min(Math.pow(2, newAttempts - 5), 30);
    setLockedUntil(new Date(Date.now() + lockMinutes * 60 * 1000));
  }
};
```

The Next.js backend must also enforce server-side rate limiting per IP and per email address.

---

### LOW / INFORMATIONAL

---

#### L-1 — EAS Project ID Exposed in `app.json`

**File:** `app.json` line 49  
**Risk:** The EAS `projectId` (`3f06e0f3-0ef7-4785-8ad9-07da64dc513a`) is committed to version control. This ID is required to trigger EAS builds and can be used by someone with access to the repository to submit unauthorised builds, consume build minutes, or investigate build configurations.

```json
"eas": {
  "projectId": "3f06e0f3-0ef7-4785-8ad9-07da64dc513a"
}
```

**Fix:**  
This value is generally considered semi-public by Expo, but access to EAS projects should be protected via Expo account permissions. Ensure the Expo account (`owner: "testhandy"`) has strong credentials and MFA enabled. Do not share the repository publicly while in development.

---

#### L-2 — No SSL/TLS Certificate Pinning

**Risk:** Without certificate pinning, a device configured to trust a custom root certificate authority (e.g. via a corporate proxy or attacker-controlled device) can perform a transparent MITM attack against all HTTPS traffic, including Bearer tokens and session data.

**Fix:**  
Implement certificate pinning using `react-native-ssl-pinning` or a custom `fetch` wrapper. For the Expo managed workflow this requires a custom dev client:

```typescript
import { fetch } from "react-native-ssl-pinning";

const response = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
  method: "POST",
  pkPinning: true,
  sslPinning: {
    certs: ["cert_sha256_fingerprint_here"],
  },
  body: JSON.stringify(credentials),
});
```

This is especially important for a contractor marketplace where financial and personal data is exchanged.

---

#### L-3 — Access Token Expiry of 20 Seconds is Counter-Productive

**File:** `constants/index.ts` line 14-16  
**Observation:** A 20-second access token (`ACCESS_TOKEN_EXPIRY = "20s"`) means the token is expired before most human interactions complete a second API call. This causes:

- Constant token refresh overhead (a refresh request for virtually every screen navigation)
- Increased server load from refresh endpoint calls
- Higher probability of race conditions causing unexpected 401 responses during multi-step flows

A 20-second expiry provides no practical security advantage over a 5–15 minute expiry when refresh tokens are properly rotated and revoked on logout.

**Recommendation:**  
Increase the access token lifetime to **5–15 minutes**. This is still short enough to limit exposure from a stolen token while eliminating the continuous refresh churn. Pair with proper refresh token rotation and server-side revocation.

---

## 5. Token & Storage Security Reference

| Platform | Access Token Storage | Refresh Token Storage | User Data Cache |
|---|---|---|---|
| iOS / Android | `expo-secure-store` ✅ | `expo-secure-store` ✅ | `expo-secure-store` ✅ |
| Web (`Platform.OS === "web"`) | `localStorage` ⚠️ | `localStorage` ⚠️ | `localStorage` ⚠️ |

### What `expo-secure-store` provides (native)
- iOS: Keychain Services — hardware-backed on devices with Secure Enclave
- Android: Android Keystore System — hardware-backed on API 23+
- Data is sandboxed to the app; not accessible to other apps
- Data is wiped on app uninstall
- **Caveat:** On a rooted/jailbroken device, a privileged attacker can access Keychain/Keystore data

### What `localStorage` provides (web)
- Accessible to any JavaScript running in the same origin (XSS = full token theft)
- Persists across sessions until explicitly cleared
- Not encrypted
- **Do not use for tokens on web**

---

## 6. Remediation Checklist

Use this checklist to track remediation progress. Items are ordered by priority.

### Before Production Launch (Blockers)

- [ ] **C-1** Remove `sender_id` and `userId` from all chat API request bodies. Verify the Next.js server derives sender identity exclusively from `req.auth.user` (JWT).
- [ ] **C-2** Remove `receiver_id: "placeholder"` from `replyToConversation()`. Server must look up participants from the conversation record, not from the request body.
- [ ] **C-3** Audit every contractor-gated server endpoint to ensure role verification comes from the JWT, not from any client-supplied field. `applyRoleOverride()` must be UI-only.
- [ ] **H-1** On `Platform.OS === "web"`, do not store tokens in `localStorage`. Use `HttpOnly` session cookies or `sessionStorage` as an interim measure.
- [ ] **H-2** Remove hardcoded `http://localhost:3000` from `lib/auth-client.ts`. Drive all base URLs from `EXPO_PUBLIC_BASE_URL`. Add a startup assertion that throws in production if the variable is missing or uses HTTP.
- [ ] **H-3** Replace `Math.random()` in OAuth state generation with `Crypto.getRandomBytesAsync(32)`.
- [ ] **H-4** Remove all `console.log` calls that output email addresses, tokens, full response bodies, or other PII. Introduce a `logger` utility gated on `__DEV__`.
- [ ] **M-1** Remove or disable `app/test-api.tsx` and `app/test-better-auth.tsx` in production builds.
- [ ] **M-2** Remove `utils/apiDebugger.tsx` from production builds or at minimum replace hardcoded `http://localhost:3000` with `BASE_URL`.

### Before First External User (High Priority)

- [ ] **M-3** Add Zod validation schemas to all chat and auth API calls before sending to the server.
- [ ] **M-4** Confirm the Next.js backend implements refresh token rotation (old token invalidated on use). Reduce refresh token lifetime to ≤ 7 days.
- [ ] **M-5** Log and surface server-side logout failures to the user. Ensure the backend maintains a refresh token revocation list.
- [ ] **M-6** Add client-side login attempt tracking with exponential backoff. Confirm the backend has rate limiting on `/api/mobile/auth/login`.
- [ ] **L-3** Increase access token expiry from 20 seconds to 5–15 minutes to eliminate refresh churn while maintaining short-lived access.

### Hardening (Ongoing)

- [ ] **L-1** Enable MFA on the Expo/EAS account (`owner: testhandy`). Restrict repository access.
- [ ] **L-2** Implement SSL certificate pinning for the production API domain using a custom dev client build.
- [ ] Centralise the Axios instance — `api/authapi.tsx` and `utils/authenticatedFetch.ts` both define independent Axios instances with duplicate interceptors. Merge into a single `utils/apiClient.ts`.
- [ ] Add a Content-Security-Policy header on the Next.js web build to mitigate XSS risk for the web platform.
- [ ] Implement audit logging on the server for all authentication events (login, logout, token refresh, role switch).
- [ ] Add automated security scanning (e.g. `npm audit`, Snyk, or similar) to the CI/CD pipeline.

---

*Last updated: 2026-03-26*
