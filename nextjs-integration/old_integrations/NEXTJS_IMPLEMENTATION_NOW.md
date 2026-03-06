# IMMEDIATE Next.js Implementation Required

## 🔴 CRITICAL: Your Next.js backend is missing the mobile auth endpoints!

The error shows requests to `/api/mobile/auth/login` are being redirected to `/en/auth/login`, which means the mobile endpoints don't exist yet.

---

## 📋 Important: Better Auth Response Format

The endpoints in `mobile-better-auth.md` **proxy Better Auth responses directly** using `asResponse: true`. This means:

1. **Better Auth handles authentication** - You don't need to manually verify credentials
2. **Better Auth's JWT plugin provides tokens** - Tokens are included in the response automatically
3. **Response format** - Better Auth returns `{ user, session, token?, refreshToken? }`
4. **CORS headers** - Added to allow mobile app access

The mobile app has been updated to handle Better Auth's response format and extract tokens from various possible locations in the response.

---

## Where is Your Next.js Project?

You need to create these files in your **Next.js backend project** (NOT in this React Native project).

Typical location: `/Users/test1/Documents/bnbsos/nextjs-app/` or similar.

---

## Files to Create in Next.js Backend

### 1. 🔥 MOST CRITICAL: Login Endpoint

**Location:** `app/api/mobile/auth/login/route.ts`

**Note:** This endpoint proxies Better Auth's response directly (as per `mobile-better-auth.md`). Better Auth with JWT plugin will return tokens in the response.

```typescript
// app/api/mobile/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Use Better Auth's signInEmail API with asResponse: true to proxy the response
    const result = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    // Clone the response body
    const resBody = await result.clone().text();

    // Create new response with Better Auth's response body
    const response = new NextResponse(resBody, {
      status: result.status,
    });

    // Forward set-cookie headers if present (Better Auth session cookies)
    const setCookie = result.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    // Set content type
    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
    );

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
  } catch (err: unknown) {
    console.error("Login error:", err);
    const response = NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }
}
```

**Important:** Better Auth with JWT plugin returns tokens in the response. The response format will be:
```json
{
  "user": { ... },
  "session": { ... },
  "token": "jwt_access_token",  // From JWT plugin
  "refreshToken": "jwt_refresh_token"  // From JWT plugin (if configured)
}
```

---

### 2. 🔥 CRITICAL: Token Refresh Endpoint

**Location:** `app/api/mobile/auth/refresh/route.ts`

**Note:** Better Auth with JWT plugin handles token refresh. However, if you need a custom refresh endpoint, use this implementation. Otherwise, Better Auth's native refresh endpoint should work.

```typescript
// app/api/mobile/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateMobileToken, generateRefreshToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        contractor: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Generate new tokens
    const newAccessToken = generateMobileToken({
      userId: user.id,
      email: user.email!,
      isContractor: !!user.contractor,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email!,
      isContractor: !!user.contractor,
    });

    const response = NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return response;
  } catch (error: any) {
    console.error("Token refresh error:", error);
    const response = NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}
```

**Alternative:** If Better Auth's JWT plugin provides a refresh endpoint, you can proxy it similar to login/register.

---

### 3. 🔥 HIGH PRIORITY: Register Endpoint

**Location:** `app/api/mobile/auth/register/route.ts`

**Note:** This endpoint proxies Better Auth's response directly (as per `mobile-better-auth.md`).

```typescript
// app/api/mobile/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Use Better Auth's signUpEmail API with asResponse: true to proxy the response
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: true,
    });

    // Clone the response body
    const resBody = await result.clone().text();

    // Create new response with Better Auth's response body
    const response = new NextResponse(resBody, {
      status: result.status,
    });

    // Set content type
    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
    );

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
  } catch (err: unknown) {
    console.error("Registration error:", err);
    const response = NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }
}
```

---

### 4. Check if `lib/jwt.ts` exists

**Note:** If Better Auth's JWT plugin provides tokens automatically, you may not need custom JWT functions. However, if you need a custom refresh endpoint or want to generate tokens manually, your `lib/jwt.ts` should have these functions. If it doesn't exist, here's the complete implementation:

**Location:** `lib/jwt.ts`

```typescript
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + "_refresh";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface MobileTokenPayload {
  userId: string;
  email: string;
  isContractor?: boolean;
  type: "access" | "refresh" | "session";
}

/**
 * Generate JWT token for mobile authentication
 */
export function generateMobileToken(
  payload: Omit<MobileTokenPayload, "type">,
  expiresIn: string = "20s"
): string {
  return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, { expiresIn });
}

/**
 * Generate refresh token for mobile authentication
 */
export function generateRefreshToken(
  payload: Omit<MobileTokenPayload, "type">,
  expiresIn: string = "30d"
): string {
  return jwt.sign({ ...payload, type: "refresh" }, REFRESH_SECRET, {
    expiresIn,
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyMobileToken(token: string): MobileTokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as MobileTokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): MobileTokenPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET) as MobileTokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}

/**
 * Get user from token and verify against database
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = verifyMobileToken(token);

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        contractor: true,
        accounts: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error("Invalid token or user not found");
  }
}
```

---

### 5. Update Environment Variables

Make sure your Next.js `.env` or `.env.local` has:

```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-different-from-jwt-secret
```

---

## 📁 Next.js Project Structure After Implementation

```
your-nextjs-app/
├── app/
│   └── api/
│       └── mobile/
│           └── auth/
│               ├── login/
│               │   └── route.ts       ✅ CREATE THIS
│               ├── register/
│               │   └── route.ts       ✅ CREATE THIS
│               └── refresh/
│                   └── route.ts       ✅ CREATE THIS
├── lib/
│   ├── jwt.ts                         ✅ VERIFY THIS EXISTS
│   └── db.ts                          ✅ (should already exist)
└── auth.ts                            ✅ (should already exist)
```

---

## 🚀 Quick Implementation Steps

### Step 1: Navigate to Your Next.js Project

```bash
cd /path/to/your/nextjs-app
# Example: cd ~/Documents/bnbsos/nextjs-app
```

### Step 2: Create Directory Structure

```bash
mkdir -p app/api/mobile/auth/login
mkdir -p app/api/mobile/auth/register
mkdir -p app/api/mobile/auth/refresh
```

### Step 3: Create Files

Copy the code above into these files:
1. `app/api/mobile/auth/login/route.ts`
2. `app/api/mobile/auth/register/route.ts`
3. `app/api/mobile/auth/refresh/route.ts`

### Step 4: Verify `lib/jwt.ts` Exists

If it doesn't exist, create it with the code above.

### Step 5: Install Dependencies (if needed)

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### Step 6: Restart Next.js

```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🧪 Test the Endpoints

Once implemented, test with curl:

### Test Login

```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8081" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

**Expected Response (Better Auth format):**
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "test@example.com",
    "emailVerified": null,
    "role": "USER",
    "isTwoFactorEnabled": false
  },
  "session": {
    "id": "...",
    "userId": "...",
    "expiresAt": "...",
    "token": "..."
  },
  "token": "eyJ...",  // From JWT plugin
  "refreshToken": "eyJ..."  // From JWT plugin (if configured)
}
```

**Note:** The exact response format depends on Better Auth's JWT plugin configuration. Tokens may be in `token`/`refreshToken` fields or within the `session` object.

### Test OPTIONS (CORS Preflight)

```bash
curl -X OPTIONS http://localhost:3000/api/mobile/auth/login \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Should see headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

**Note:** The implementation uses `"*"` for CORS origin (as per `mobile-better-auth.md`). For production, you may want to restrict this to specific origins.

---

## ⚠️ Common Issues

### Issue: "Cannot find module '@/lib/jwt'"

**Solution:** Make sure `lib/jwt.ts` exists with the implementation above.

### Issue: "JWT_SECRET is not defined"

**Solution:** Add to your Next.js `.env.local`:
```env
JWT_SECRET=your-secret-key-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here
```

### Issue: Still getting CORS errors

**Solution:** Make sure:
1. The endpoint files are created in the correct location
2. Next.js dev server is restarted
3. The Origin header matches (should be `http://localhost:8081`)

### Issue: "auth.api.signInEmail is not a function"

**Solution:** Make sure your `auth.ts` exports the Better Auth instance correctly. Check that you're using `better-auth` and have the correct imports.

### Issue: "No token found in response"

**Solution:** This means Better Auth's JWT plugin might not be configured correctly. Check:
1. JWT plugin is added to `auth.ts` plugins array
2. `lib/jwt.ts` functions exist (if using custom tokens)
3. Better Auth JWT plugin configuration in `auth.ts` (lines 129-141 in mobile-better-auth.md)

### Issue: Better Auth response format differs

**Solution:** The mobile app now handles multiple token locations:
- `response.data.token` or `response.data.session.token`
- `response.data.refreshToken` or `response.data.session.refreshToken`

If Better Auth returns tokens in a different format, update the mobile app's `api/authapi.tsx` to extract tokens from the correct location.

---

## 📝 Quick Checklist

Before testing the mobile app again:

- [ ] Created `app/api/mobile/auth/login/route.ts`
- [ ] Created `app/api/mobile/auth/register/route.ts`
- [ ] Created `app/api/mobile/auth/refresh/route.ts`
- [ ] Verified `lib/jwt.ts` exists with all functions
- [ ] Added `JWT_SECRET` to `.env.local`
- [ ] Added `REFRESH_TOKEN_SECRET` to `.env.local`
- [ ] Restarted Next.js dev server
- [ ] Tested login endpoint with curl

---

## ✅ Once Implemented

After creating these files and restarting Next.js:

1. Go back to your React Native app
2. Refresh the page (press `r` in terminal or reload in browser)
3. Try logging in again
4. It should work! 🎉

---

## Need Help?

If you still have issues after implementing:
1. Check Next.js terminal for error logs
2. Check browser console for detailed error messages
3. Verify file locations match exactly
4. Make sure Next.js server restarted after creating files

The mobile app code is already updated and ready - it's just waiting for these Next.js endpoints!
