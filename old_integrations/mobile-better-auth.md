## Mobile Better Auth Integration – Reference Bundle

This file bundles the **exact source code** of all key Better Auth and mobile‑auth–related modules from the Next.js project, so you can reference or copy them when configuring authentication in a React Native app.  
Each section includes:
- **Path** in this project
- **Short description**
- **Complete, unmodified code**

---

### `auth.config.ts`

**Path**: `auth.config.ts`  
**Description**: Legacy placeholder; real Better Auth configuration now lives in `auth.ts`. Kept here only for historical reference.

```ts
// This file is no longer needed with Better Auth
// All authentication configuration is now in auth.ts
// This file can be deleted, but keeping it temporarily for reference

export default {};
```

---

### `auth.ts`

**Path**: `auth.ts`  
**Description**: Main Better Auth configuration and helpers, including Prisma adapter, JWT & 2FA plugins, Expo support, and `currentUser` / `currentRole` helpers.

```ts
//tutorial version

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getUserbyEmail } from "@/app/[locale]/data/users";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  updatesendVerificationEmail,
  sendContractorOnboardingEmail,
} from "@/lib/mail";
import { cookies } from "next/headers";
import { expo } from "@better-auth/expo"; // Expo server plugin

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // Base URL configuration
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // App name for 2FA issuer
  appName: "BnbSos",

  // Allow deep link origins for Expo
  trustedOrigins: [
    process.env.EXPO_SCHEME ? `${process.env.EXPO_SCHEME}://` : "myapp://",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Changed to false to require email verification
    requireEmailVerification: true; // Require email verification before login
    password: {
      hash: async (password: string) => {
        // Hash new passwords with bcrypt
        return bcrypt.hash(password, 10);
      },
      verify: async (data: { hash: string; password: string }) => {
        // Use bcrypt to verify existing passwords
        return bcrypt.compare(data.password, data.hash);
      },
    },
    sendResetPassword: async ({ user, url, token }: any) => {
      try {
        await sendPasswordResetEmail(user.email, token);
        console.log(`Reset password email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send reset password email:", error);
        throw error;
      }
    },
    sendVerificationEmail: async ({ user, url, token }: any) => {
      try {
        // Check if user is registered as a contractor by looking for the pending marker
        const contractorPending = await db.verification.findFirst({
          where: {
            identifier: `contractor-pending:${user.email}`,
          },
        });
        const isContractor = !!contractorPending;
        
        await sendVerificationEmail(user.email, token, isContractor);
        console.log(`Verification email sent to ${user.email} (contractor: ${isContractor})`);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
      }
    },
  },

  // Social providers (maintaining your existing ones)
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // JWT plugin for React Native support
  plugins: [
    expo({
      // overrideOrigin can help if hosting Better Auth behind Expo API routes
      overrideOrigin: false,
    }),
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        audience: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        expirationTime: "15m",
      },
      jwks: {
        keyPairConfig: {
          alg: "EdDSA",
          crv: "Ed25519",
        },
      },
    }),
    twoFactor({
      // Maintain your existing 2FA functionality with proper issuer
      issuer: "BnbSos",
    }),
    nextCookies(), // Must be last to handle cookies properly
  ],

  // User configuration with additional fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
      },
      isTwoFactorEnabled: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Server-side function to get current user
export async function currentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return null;
    }

    // Get session from Better Auth
    const result = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken.value}`,
      }),
    });

    if (result && result.session) {
      // Get user data from the session
      const user = await db.user.findUnique({
        where: { id: result.session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          isTwoFactorEnabled: true,
        },
      });

      if (user) {
        // Check if user has OAuth accounts
        const oauthAccounts = await db.account.findMany({
          where: {
            userId: user.id,
            providerId: {
              not: "credential",
            },
          },
        });

        // Add isOAuth property
        return {
          ...user,
          isOAuth: oauthAccounts.length > 0,
        };
      }

      return user;
    }

    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Server-side function to get current user's role
export async function currentRole() {
  try {
    const user = await currentUser();
    return user?.role;
  } catch (error) {
    console.error("Error getting current role:", error);
    return null;
  }
}
```

---

### `middleware.ts`

**Path**: `middleware.ts`  
**Description**: Global middleware combining Better Auth session checks with CORS handling for `/api/mobile` and other API routes, plus locale routing.

```ts
//middleware.ts

import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

import { routing } from "./i18n/routing";

import { NextRequest, NextResponse } from "next/server";
import { mobileCorsMiddleware } from "@/lib/mobile-cors-middleware";

// CORS configuration for mobile API routes
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8081";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400", // 24 hours
};

const intlMiddleware = createMiddleware(routing);

// Function to create CORS response
function createCorsResponse(origin: string, status: number = 200) {
  return new NextResponse(null, {
    status,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Origin": origin,
    },
  });
}

// Function to add CORS headers to existing response
function addCorsHeaders(response: NextResponse, origin: string) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    if (key === "Access-Control-Allow-Origin") {
      response.headers.set(key, origin);
    } else {
      response.headers.set(key, value);
    }
  });
  return response;
}

export async function middleware(req: NextRequest, ctx: any) {
  // Get the origin from the request and validate it
  const requestOrigin = req.headers.get("origin");
  const origin = requestOrigin === CORS_ORIGIN ? requestOrigin : CORS_ORIGIN;

  // Check if this is a CORS-enabled API route
  const isCorsRoute =
    req.nextUrl.pathname.startsWith("/api/chat") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/api/mobile") ||
    req.nextUrl.pathname.startsWith("/api/stripe") ||
    req.nextUrl.pathname.startsWith("/api/geo");

  if (isCorsRoute) {
    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      return createCorsResponse(origin);
    }

    // For Better Auth API routes, let Better Auth handle them directly
    if (req.nextUrl.pathname.startsWith("/api/auth")) {
      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    // For public API routes (no auth required)
    if (req.nextUrl.pathname.startsWith("/api/geo")) {
      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    // For other API routes, use cookie-based auth check (Edge Runtime compatible)
    const { nextUrl } = req;
    const sessionCookie = req.cookies.get("better-auth.session_token");
    const isLoggedIn = !!sessionCookie?.value;

    const isApiAuthRoute =
      nextUrl.pathname.startsWith(apiAuthPrefix) ||
      nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        const redirectResponse = NextResponse.redirect(
          new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
        );
        return addCorsHeaders(redirectResponse, origin);
      }
      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    if (!isLoggedIn && !isPublicRoute) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      const redirectResponse = NextResponse.redirect(
        new URL(`/en/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
      return addCorsHeaders(redirectResponse, origin);
    }

    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  // For non-API routes, handle authentication for page routes
  try {
    const { nextUrl } = req;

    // Check for session cookie instead of using auth.api.getSession in Edge Runtime
    const sessionCookie = req.cookies.get("better-auth.session_token");
    const isLoggedIn = !!sessionCookie?.value;

    const isApiAuthRoute =
      nextUrl.pathname.startsWith(apiAuthPrefix) ||
      nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
      return intlMiddleware(req);
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
      return intlMiddleware(req);
    }

    if (!isLoggedIn && !isPublicRoute) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return NextResponse.redirect(
        new URL(`/en/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
    }

    return intlMiddleware(req);
  } catch (error) {
    console.error("Error in Better Auth middleware for pages:", error);
    return intlMiddleware(req);
  }
}

export const config = {
  // This here invokes middleware
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  // Example of how middleware works, you can see the route in the nextUrl
  // matcher: ["/auth/login", "/auth/register"],
};
```

---

### `lib/auth-client.ts`

**Path**: `lib/auth-client.ts`  
**Description**: React client wrapper around Better Auth, exporting hooks and helpers that mirror common auth operations (sign in, sign up, 2FA, etc.).

```ts
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        // Handle the 2FA verification globally
        window.location.href = "/auth/two-factor";
      },
    }),
  ],
});

// Export the client directly
export default authClient;

// Export commonly used methods directly from the client
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
export const getSession = authClient.getSession;
export const updateUser = authClient.updateUser;
export const changePassword = authClient.changePassword;
export const forgetPassword = authClient.forgetPassword;
export const resetPassword = authClient.resetPassword;
export const verifyEmail = authClient.verifyEmail;
export const sendVerificationEmail = authClient.sendVerificationEmail;
export const linkSocial = authClient.linkSocial;
export const twoFactor = authClient.twoFactor;

// Helper function for authentication status (replaces NextAuth's useSession pattern)
export function useAuthStatus() {
  const { data: session, isPending, error } = authClient.useSession();

  return {
    session,
    status: isPending
      ? "loading"
      : session
      ? "authenticated"
      : "unauthenticated",
    isLoading: isPending,
    error,
  };
}

// Type exports
export type AuthSession = typeof authClient.$Infer.Session;
```

---

### `lib/auth-utils.ts`

**Path**: `lib/auth-utils.ts`  
**Description**: Simple helper wrapping `useAuthStatus` to check authentication state.

```ts
import { useAuthStatus } from "@/lib/auth-client";

export function isAuthenticated() {
  const { status } = useAuthStatus();
  return status === "authenticated";
}
```

---

### `next-auth.d.ts`

**Path**: `next-auth.d.ts`  
**Description**: Type definition for the extended Better Auth user model used across the app.

```ts
// Type definitions for Better Auth
// This replaces the NextAuth type definitions

export type ExtendedUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: "USER" | "ADMIN";
  isTwoFactorEnabled: boolean;
  emailVerified: boolean;
};
```

---

### `scripts/migrate-to-better-auth.js`

**Path**: `scripts/migrate-to-better-auth.js`  
**Description**: Node script to migrate existing users into Better Auth’s `account` model with credential provider entries.

```js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateToBetterAuth() {
  try {
    console.log("Starting migration to Better Auth...");

    // Get all users with passwords
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    console.log(`Found ${users.length} users with passwords to migrate`);

    for (const user of users) {
      if (!user.email) {
        console.log(`Skipping user ${user.id} - no email`);
        continue;
      }

      // Check if account already exists
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          providerId: "credential",
          accountId: user.email,
        },
      });

      if (existingAccount) {
        console.log(
          `Account already exists for ${user.email}, updating password...`
        );

        // Update existing account with password
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: { password: user.password },
        });
      } else {
        console.log(`Creating new account for ${user.email}...`);

        // Create new account with Better Auth field names
        await prisma.account.create({
          data: {
            userId: user.id,
            providerId: "credential", // Better Auth expects this
            accountId: user.email, // Better Auth expects this
            password: user.password,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    console.log("Migration completed successfully!");

    // Verify the migration
    const accounts = await prisma.account.findMany({
      where: {
        providerId: "credential",
      },
      select: {
        id: true,
        userId: true,
        providerId: true,
        accountId: true,
        password: true,
      },
    });

    console.log(
      `\nVerification: Found ${accounts.length} credential accounts:`
    );
    accounts.forEach((account) => {
      console.log(`- ${account.accountId} (User ID: ${account.userId})`);
    });
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToBetterAuth();
```

---

### `app/api/mobile/auth/login/route.ts`

**Path**: `app/api/mobile/auth/login/route.ts`  
**Description**: Mobile login endpoint using Better Auth’s `signInEmail` API and adding permissive CORS headers.

```ts
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
    const { email, password } = await req.json();

    const result = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    const resBody = await result.clone().text();

    const response = new NextResponse(resBody, {
      status: result.status,
    });

    // forward set-cookie headers if present
    const setCookie = result.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);

    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
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
  } catch (err: unknown) {
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

### `app/api/mobile/auth/register/route.ts`

**Path**: `app/api/mobile/auth/register/route.ts`  
**Description**: Mobile registration endpoint calling Better Auth’s `signUpEmail` API with CORS headers.

```ts
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

    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: true,
    });

    const resBody = await result.clone().text();

    const response = new NextResponse(resBody, {
      status: result.status,
    });

    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
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
  } catch (err: unknown) {
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

### `app/api/mobile/auth/reset-password/route.ts`

**Path**: `app/api/mobile/auth/reset-password/route.ts`  
**Description**: Mobile password reset endpoint supporting both “request reset email” (`POST`) and “complete reset with token” (`PATCH`), proxied through Better Auth.

```ts
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

// POST /api/mobile/auth/reset-password -> send reset email
export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json();

    const result = await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: redirectTo || "/auth/new-password",
      },
      asResponse: true,
    });

    const resBody = await result.clone().text();

    const response = new NextResponse(resBody, { status: result.status });
    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
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
  } catch (err: unknown) {
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

// PATCH /api/mobile/auth/reset-password -> complete reset with token
export async function PATCH(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    const result = await auth.api.resetPassword({
      body: {
        token,
        newPassword,
      },
      asResponse: true,
    });

    const resBody = await result.clone().text();

    const response = new NextResponse(resBody, { status: result.status });
    response.headers.set(
      "Content-Type",
      result.headers.get("Content-Type") || "application/json"
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
  } catch (err: unknown) {
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

### `lib/jwt.ts`

**Path**: `lib/jwt.ts`  
**Description**: JWT helpers for mobile tokens (access, refresh, and session) plus utilities for verifying tokens and building a standard mobile auth response payload.

```ts
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + "_refresh";

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
 * Generate session token for OAuth flow
 */
export function generateSessionToken(
  payload: Omit<MobileTokenPayload, "type">,
  expiresIn: string = "5m"
): string {
  return jwt.sign({ ...payload, type: "session" }, JWT_SECRET, { expiresIn });
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

/**
 * Generate mobile auth response with tokens
 */
export function generateMobileAuthResponse(user: any) {
  const accessToken = generateMobileToken({
    userId: user.id,
    email: user.email,
    isContractor: !!user.contractor,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    isContractor: !!user.contractor,
  });

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isContractor: !!user.contractor,
      emailVerified: user.emailVerified,
    },
  };
}
```

---

### `lib/mobile-cors-middleware.ts`

**Path**: `lib/mobile-cors-middleware.ts`  
**Description**: Utility CORS middleware and helper for `/api/mobile/**` routes.

```ts
import { NextRequest, NextResponse } from "next/server";

// CORS configuration for mobile API routes
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * CORS middleware for mobile API routes
 * This should be called from the main Next.js middleware
 */
export function mobileCorsMiddleware(req: NextRequest): NextResponse | null {
  // Only handle mobile API routes
  if (!req.nextUrl.pathname.startsWith("/api/mobile")) {
    return null; // Let other middleware handle it
  }

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // For non-OPTIONS requests, let the route handler process the request
  // but prepare CORS headers to be added to the response
  const response = NextResponse.next();

  // Add CORS headers to the response
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Utility function to add CORS headers to any response
 * Can be used in route handlers if needed
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

---

### `app/[locale]/authentication/user-auth-form.tsx`

**Path**: `app/[locale]/authentication/user-auth-form.tsx`  
**Description**: Example authentication form UI (email sign-in) that can be adapted to React Native screens.

```tsx
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icons } from "@/app/[locale]/authentication/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)

        setTimeout(() => {
            setIsLoading(false)
        }, 3000)
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In with Email
                    </Button>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isLoading}>
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.gitHub className="mr-2 h-4 w-4" />
                )}{" "}
                GitHub
            </Button>
        </div>
    )
}
```

---

### `actions/logout.ts`

**Path**: `actions/logout.ts`  
**Description**: Server action that signs out using Better Auth and manually clears session cookies.

```ts
"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";

export const logout = async () => {
  try {
    console.log("🔍 Logout Server Action - Starting logout");

    // Call Better Auth's signOut API
    await auth.api.signOut({
      headers: new Headers(),
    });

    // Manually clear the session cookies
    const cookieStore = await cookies();
    cookieStore.delete("better-auth.session_token");
    cookieStore.delete("session-role"); // Clear session role preference

    console.log("🔍 Logout Server Action - Session and role cleared");

    return { success: "Logged out successfully!" };
  } catch (error: unknown) {
    console.error("Logout error:", error);

    // Even if Better Auth logout fails, clear the cookies manually
    try {
      const cookieStore = await cookies();
      cookieStore.delete("better-auth.session_token");
      cookieStore.delete("session-role"); // Clear session role preference
    } catch (cookieError) {
      console.error("Error clearing cookies:", cookieError);
    }

    return { error: "Failed to logout!" };
  }
};
```

---

### `actions/search.ts`

**Path**: `actions/search.ts`  
**Description**: Example of server-side logic that uses Better Auth’s `getSession` from cookies to implement authorization‑aware search; useful for understanding how session checks are wired outside API routes.

```ts
"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { auth } from "@/auth";

// First ensure the unaccent extension exists (this should be done during database setup)
let unaccentExtensionEnsured: Promise<void> | null = null;
export async function ensureUnaccentExtension() {
  // Avoid running CREATE EXTENSION on every request; do it once per server instance.
  if (!unaccentExtensionEnsured) {
    unaccentExtensionEnsured = db.$executeRaw`CREATE EXTENSION IF NOT EXISTS unaccent;`.then(
      () => undefined
    );
  }
  return unaccentExtensionEnsured;
}

async function getIsSignedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token");

  if (!sessionToken?.value) return false;

  try {
    const result = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${sessionToken.value}`,
      }),
    });
    return !!result?.session;
  } catch {
    return false;
  }
}

// This function performs the full-text search based on the query
export async function searchContractors(
  query: string,
  location?: string,
  cityIds?: string[]
) {
  // If no query but we have location, search for all contractors in that location
  if (!query && !location && (!cityIds || cityIds.length === 0)) {
    return [];
  }

  const trimmedQuery = (query || "").trim();
  const hasTextQuery = trimmedQuery.length > 0;

  // Location-only search (fast path): no full-text, just filter by city/region list.
  if (!hasTextQuery && (location || (cityIds && cityIds.length > 0))) {
    const params: any[] = [];
    const whereClause = location
      ? 'WHERE LOWER(c.city) = LOWER($1)'
      : 'WHERE LOWER(c.city) = ANY($1)';

    if (location) {
      params.push(location.toLowerCase());
    } else {
      params.push(cityIds!.map((id) => id.toLowerCase()));
    }

    const queryString = `
      SELECT
        c.id,
        c.uid,
        c."userId",
        c."datePosted",
        c.confirmed,
        c.address,
        c.availability,
        c.certifications,
        c.city,
        c.name,
        c.phone,
        c.rating,
        c."yearsOfExperience",
        c.description,
        c."contractorLatitude",
        c."contractorLongitude",
        c."imageId",
        c."backgroundImageUrl",
        c.specializations,
        c."premiumPlacement",
        c."placementTier",
        c."placementExpiresAt",
        c."selectedPosition"
      FROM "Contractor" c
      ${whereClause}
      ORDER BY
        c.rating DESC NULLS LAST,
        c."datePosted" DESC;
    `;

    const contractors = await db.$queryRawUnsafe(queryString, ...params);

    const isSignedIn = await getIsSignedIn();
    if (!isSignedIn && Array.isArray(contractors)) {
      return contractors.map((c: any) => ({ ...c, phone: "" }));
    }
    return contractors;
  }

  // Normalize the search query (full-text)
  const normalizedQuery = trimmedQuery.toLowerCase();

  // Execute search using PostgreSQL full-text search + LIKE fallback for partial matches
  // Build the base query
  // Using 'english' configuration to match existing GIN indexes for optimal performance
  // $1 = normalized query for full-text search
  // $2 = LIKE pattern (%query%) for partial matching
  // $3/$4 = location filter (if provided)
  let queryString = `
    WITH q AS (
      SELECT
        websearch_to_tsquery('english', $1) AS qsl,
        websearch_to_tsquery('english', $1) AS qen
    ),
    search_data AS (
      SELECT 
        c.id,
        c.uid,
        c."userId",
        c."datePosted",
        c.confirmed,
        c.address,
        c.availability,
        c.certifications,
        c.city,
        c.name,
        c.phone,
        c.rating,
        c."yearsOfExperience",
        c.description,
        c."contractorLatitude",
        c."contractorLongitude",
        c."imageId",
        c."backgroundImageUrl",
        c.specializations,
        c."premiumPlacement",
        c."placementTier",
        c."placementExpiresAt",
        c."selectedPosition",
        EXISTS (
          SELECT 1 
          FROM unnest(c.specializations::text[]) spec 
          WHERE to_tsvector('english', lower(spec)) @@ (SELECT qsl FROM q)
          OR to_tsvector('english', lower(spec)) @@ (SELECT qen FROM q)
          OR lower(spec) LIKE $2
        ) as has_matching_specialization,
        EXISTS (
          SELECT 1 
          FROM unnest(c.certifications::text[]) cert 
          WHERE to_tsvector('english', lower(cert)) @@ (SELECT qsl FROM q)
          OR to_tsvector('english', lower(cert)) @@ (SELECT qen FROM q)
          OR lower(cert) LIKE $2
        ) as has_matching_certification,
        (to_tsvector('english', COALESCE(LOWER(name), '')) @@ (SELECT qsl FROM q)) as fts_name_match,
        (LOWER(name) LIKE $2) as like_name_match
      FROM "Contractor" c
    )
    SELECT * FROM search_data
    WHERE 
      ${
        location
          ? "LOWER(city) = LOWER($3) AND "
          : cityIds && cityIds.length > 0
          ? "LOWER(city) = ANY($3) AND "
          : ""
      }
      (fts_name_match
      OR to_tsvector('english', COALESCE(LOWER(name), '')) @@ (SELECT qen FROM q)
      OR like_name_match
      OR has_matching_specialization
      OR to_tsvector('english', COALESCE(LOWER(city), '')) @@ (SELECT qsl FROM q)
      OR to_tsvector('english', COALESCE(LOWER(city), '')) @@ (SELECT qen FROM q)
      OR LOWER(city) LIKE $2
      OR to_tsvector('english', COALESCE(LOWER(description), '')) @@ (SELECT qsl FROM q)
      OR to_tsvector('english', COALESCE(LOWER(description), '')) @@ (SELECT qen FROM q)
      OR LOWER(description) LIKE $2
      OR has_matching_certification)
    ORDER BY 
      CASE 
        WHEN fts_name_match THEN 1
        WHEN like_name_match THEN 2
        WHEN has_matching_specialization THEN 3
        WHEN to_tsvector('english', COALESCE(LOWER(city), '')) @@ (SELECT qsl FROM q) THEN 4
        WHEN LOWER(city) LIKE $2 THEN 5
        ELSE 6
      END,
      rating DESC NULLS LAST,
      "datePosted" DESC;
  `;

  // Prepare the parameters
  // $1 = query for full-text search
  // $2 = LIKE pattern for partial matching
  // $3 = location filter (if provided)
  const likePattern = `%${normalizedQuery}%`;
  const params: any[] = [normalizedQuery, likePattern];
  if (location) {
    params.push(location.toLowerCase());
  } else if (cityIds && cityIds.length > 0) {
    params.push(cityIds.map((id) => id.toLowerCase()));
  }

  // Execute the query with parameters
  const contractors = await db.$queryRawUnsafe(queryString, ...params);

  // Never send private contact info to unauthenticated users (also reduces RSC payload size).
  const isSignedIn = await getIsSignedIn();
  if (!isSignedIn && Array.isArray(contractors)) {
    return contractors.map((c: any) => ({ ...c, phone: "" }));
  }

  return contractors;
}
```

---

### `actions/contractors.ts`

**Path**: `actions/contractors.ts`  
**Description**: Larger server action module that shows multiple patterns for using Better Auth session tokens on the server (authorization checks, controlling access to contractor data, etc.) that you can mirror in mobile‑specific endpoints if needed.

```ts
// actions/contractors.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma, SlotStatus } from "@prisma/client";
import { headers, cookies } from "next/headers";

interface ContractorBase {
  id: number;
  uid: string; // Add missing uid field
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  description: string | null;
  certifications: string[];
  yearsOfExperience: number | null;
  availability: string;
  address: string;
  contractorLatitude: number;
  contractorLongitude: number;
  datePosted: Date;
  confirmed: boolean;
  imageId: string | null;
  userId: string;
  phone: string;
  premiumPlacement?: boolean;
  user: {
    email: string | null;
  };
}

// New server action to check contractor status
export async function checkContractorStatus(userId: string) {
  try {
    const contractor = await db.contractor.findUnique({
      where: { userId },
      select: {
        id: true,
        confirmed: true,
        name: true,
      },
    });

    if (!contractor) {
      return {
        success: false,
        error: "No contractor profile found for this account",
        hasProfile: false,
      };
    }

    if (!contractor.confirmed) {
      return {
        success: false,
        error:
          "Contractor profile not yet confirmed. Please check your email for verification link.",
        hasProfile: true,
        confirmed: false,
      };
    }

    return {
      success: true,
      hasProfile: true,
      confirmed: true,
      contractor: {
        id: contractor.id,
        name: contractor.name,
      },
    };
  } catch (error) {
    console.error("Error checking contractor status:", error);
    return {
      success: false,
      error: "Failed to check contractor status",
      hasProfile: false,
    };
  }
}

export async function getContractorsByLocationAndProfession(
  contractorLocation: string,
  profession: string[]
): Promise<ContractorBase[] | null> {
  // Use the same session checking approach as currentUser()
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token");

  let isSignedIn = false;
  if (sessionToken) {
    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });
      isSignedIn = !!result?.session;
    } catch (error) {
      console.error(
        "Error checking session in getContractorsByLocationAndProfession:",
        error
      );
      isSignedIn = false;
    }
  }

  console.log(
    "🔍 getContractorsByLocationAndProfession Debug - Authentication check:"
  );
  console.log("Session token exists:", !!sessionToken);
  console.log("isSignedIn:", isSignedIn);
  // Allow profession-only searches (e.g., from the home carousel) even when
  // contractorLocation is empty. We still require at least one profession.
  if (!profession || profession.length === 0) return null;

  try {
    // Query contractors with both exact and fuzzy matching
    const contractors = await db.contractor.findMany({
      where: {
        OR: [
          // Exact city match
          {
            city: contractorLocation,
            OR: [
              { certifications: { hasSome: profession } },
              { specializations: { hasSome: profession } },
            ],
          },
          // Fuzzy city match
          {
            city: {
              contains: contractorLocation,
              mode: "insensitive",
            },
            OR: [
              { certifications: { hasSome: profession } },
              { specializations: { hasSome: profession } },
              {
                OR: profession.map((p) => ({
                  OR: [
                    { specializations: { hasSome: [p] } },
                    { certifications: { hasSome: [p] } },
                  ],
                })),
              },
            ],
          },
        ],
      },
      orderBy: [
        // Prioritize exact city matches first, then by rating and date
        { rating: "desc" },
        { datePosted: "desc" },
      ],
      select: {
        id: true,
        name: true,
        rating: true,
        specializations: true,
        description: true,
        certifications: true,
        availability: true,
        yearsOfExperience: true,
        address: true,
        city: true,
        contractorLatitude: true,
        contractorLongitude: true,
        datePosted: true,
        confirmed: true,
        imageId: true,
        userId: true,
        premiumPlacement: true,
        placementTier: true, // MISSING FIELD - needed for premium placement
        selectedPosition: true, // MISSING FIELD - needed for premium placement
        placementExpiresAt: true, // MISSING FIELD - needed for premium placement
        user: {
          select: {
            email: true,
          },
        },
        phone: true,
        backgroundImageUrl: true,
      },
    });

    // Sort results to prioritize exact city matches
    const sortedContractors = contractors.sort((a, b) => {
      if (a.city.toLowerCase() === contractorLocation.toLowerCase()) return -1;
      if (b.city.toLowerCase() === contractorLocation.toLowerCase()) return 1;
      return 0;
    });

    // Transform the results to handle sensitive data based on auth status
    const transformedContractors = sortedContractors.map(
      (contractor) =>
        ({
          ...contractor,
          uid: contractor.userId, // Map userId to uid for component compatibility
          user: { email: isSignedIn ? contractor.user?.email : null },
          phone: isSignedIn ? contractor.phone : "",
        } as ContractorBase)
    );

    console.log(
      "🔍 getContractorsByLocationAndProfession Debug - Transformed contractors:"
    );
    console.log("Total contractors found:", transformedContractors.length);
    if (transformedContractors.length > 0) {
      console.log("First contractor transformed data:", {
        id: transformedContractors[0].id,
        uid: transformedContractors[0].uid,
        name: transformedContractors[0].name,
        hasEmail: !!transformedContractors[0].user?.email,
        hasPhone: !!transformedContractors[0].phone,
        email: transformedContractors[0].user?.email,
        phone: transformedContractors[0].phone,
      });
    }

    return transformedContractors;
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return null;
  }
}

interface ContractorId {
  contractorId: number;
}

export async function getContractorById({ contractorId }: ContractorId) {
  // Use the same session checking approach as currentUser()
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token");

  let isSignedIn = false;
  if (sessionToken) {
    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });
      isSignedIn = !!result?.session;
    } catch (error) {
      console.error("Error checking session in getContractorById:", error);
      isSignedIn = false;
    }
  }

  if (!contractorId) return null;

  try {
    const contractor = await db.contractor.findUnique({
      where: { id: contractorId },
      select: {
        id: true,
        datePosted: true,
        confirmed: true,
        address: true,
        availability: true,
        certifications: true,
        city: true,
        name: true,
        phone: isSignedIn ? true : false,
        rating: true,
        specializations: true,
        yearsOfExperience: true,
        description: true,
        contractorLatitude: true,
        contractorLongitude: true,
        userId: true,
        imageId: true,
        premiumPlacement: true,
        backgroundImageUrl: true, // Add missing field
        user: {
          select: {
            email: isSignedIn ? true : false,
          },
        },
        reviews: {
          select: {
            id: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return contractor;
  } catch (error) {
    console.error("Error fetching contractor by ID:", error);
    return null;
  }
}

export async function getAllContractors(limit?: number): Promise<ContractorBase[] | null> {
  // Use the same session checking approach as currentUser()
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token");

  let isSignedIn = false;
  if (sessionToken) {
    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });
      isSignedIn = !!result?.session;
    } catch (error) {
      isSignedIn = false;
    }
  }

  try {
    const contractors = await db.contractor.findMany({
      take: limit; // OPTIMIZATION: Add limit parameter
      orderBy: [{ rating: "desc" }, { datePosted: "desc" }],
      select: {
        id: true,
        name: true,
        rating: true,
        specializations: true,
        description: true,
        certifications: true,
        availability: true,
        yearsOfExperience: true,
        address: true,
        city: true,
        contractorLatitude: true,
        contractorLongitude: true,
        datePosted: true,
        confirmed: true,
        imageId: true,
        userId: true,
        premiumPlacement: true,
        placementTier: true, // MISSING FIELD - needed for premium placement
        selectedPosition: true, // MISSING FIELD - needed for premium placement
        placementExpiresAt: true, // MISSING FIELD - needed for premium placement
        backgroundImageUrl: true,
        user: {
          select: {
            email: true,
          },
        },
        phone: true,
      },
    });

    // Transform the results to handle sensitive data based on auth status
    const transformedContractors = contractors.map(
      (contractor) =>
        ({
          ...contractor,
          uid: contractor.userId, // Map userId to uid for component compatibility
          user: { email: isSignedIn ? contractor.user?.email : null },
          phone: isSignedIn ? contractor.phone : "",
        } as ContractorBase)
    );

    return transformedContractors;
  } catch (error) {
    console.error("Error fetching all contractors:", error);
    return null;
  }
}

export async function getContractorAvailabilitySlots(contractorId: string) {
  try {
    console.log(
      "getContractorAvailabilitySlots called with contractorId:",
      contractorId
    );

    const contractor = await db.contractor.findUnique({
      where: { id: parseInt(contractorId) },
      include: {
        availabilitySlots: true,
      },
    });

    console.log("Found contractor:", contractor);

    if (!contractor) {
      console.log("No contractor found for contractorId:", contractorId);
      return { success: false, error: "Contractor not found" };
    }

    console.log("=== DETAILED AVAILABILITY SLOTS DEBUG ===");
    console.log("contractor.availabilitySlots:", contractor.availabilitySlots);
    console.log("Number of slots:", contractor.availabilitySlots?.length || 0);

    if (
      contractor.availabilitySlots &&
      contractor.availabilitySlots.length > 0
    ) {
      contractor.availabilitySlots.forEach((slot, index) => {
        console.log(`Slot ${index}:`, {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          status: slot.status,
          startTime: slot.startTime,
          endTime: slot.endTime,
          fullSlot: slot,
        });
      });
    } else {
      console.log("No availability slots found for this contractor");
    }
    console.log("=== END AVAILABILITY SLOTS DEBUG ===");

    console.log("Returning availabilitySlots:", contractor.availabilitySlots);
    return {
      success: true,
      availabilitySlots: contractor.availabilitySlots,
    };
  } catch (error) {
    console.error("Error fetching contractor availability:", error);
    return {
      success: false,
      error: "Failed to fetch contractor availability",
    };
  }
}

export async function getContractorIdByUserId(userId: string) {
  try {
    console.log("getContractorIdByUserId called with userId:", userId);

    const contractor = await db.contractor.findUnique({
      where: { userId },
      select: { id: true },
    });

    console.log("Found contractor:", contractor);

    if (!contractor) {
      console.log("No contractor found for userId:", userId);
      return { success: false, error: "Contractor not found for this user" };
    }

    console.log("Returning contractorId:", contractor.id.toString());
    return {
      success: true,
      contractorId: contractor.id.toString(),
    };
  } catch (error) {
    console.error("Error fetching contractor ID:", error);
    return {
      success: false,
      error: "Failed to fetch contractor ID",
    };
  }
}

export async function bookAppointment(
  contractorId: string,
  startTime: string,
  endTime: string
) {
  try {
    const contractor = await db.contractor.findUnique({
      where: { id: parseInt(contractorId) },
    });

    if (!contractor) {
      return { success: false, error: "Contractor not found" };
    }

    // Use the same session checking approach as currentUser()
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return { success: false, error: "Unauthorized - No session" };
    }

    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });

      if (!result?.session || result.session.userId !== contractor.userId) {
        return { success: false, error: "Unauthorized" };
      }
    } catch (error) {
      console.error("Error checking session in bookAppointment:", error);
      return { success: false, error: "Unauthorized - Session error" };
    }

    // You might want to add a check here to ensure the user is the one in the conversation with the contractor.

    const newSlot = await db.availabilitySlot.create({
      data: {
        contractorId: parseInt(contractorId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: SlotStatus.CONFIRMED, // This marks the slot as booked
        dayOfWeek: new Date(startTime).getDay(),
      },
    });

    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Error booking appointment:", error);
    return { success: false, error: "Failed to book appointment" };
  }
}

// Approve a time slot proposal and create a confirmed availability slot
export async function approveTimeSlot({
  contractorId,
  startTime,
  endTime,
  chatId,
}: {
  contractorId: number;
  startTime: Date;
  endTime: Date;
  chatId: string;
}) {
  console.log("[approveTimeSlot] called with:", {
    contractorId,
    startTime,
    endTime,
    chatId,
  });

  try {
    // Check authentication - verify the current user is the contractor
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return {
        success: false,
        error: "Authentication required - No session",
      };
    }

    let userId: string;
    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });

      if (!result?.session?.userId) {
        return {
          success: false,
          error: "Authentication required - Invalid session",
        };
      }

      userId = result.session.userId;
    } catch (error) {
      console.error("Error checking session in approveTimeSlot:", error);
      return {
        success: false,
        error: "Authentication required - Session error",
      };
    }

    // Verify the user is actually the contractor
    const contractor = await db.contractor.findUnique({
      where: { id: contractorId },
      select: { userId: true },
    });

    if (!contractor || contractor.userId !== userId) {
      return {
        success: false,
        error:
          "Unauthorized - you can only approve slots for your own contracting business",
      };
    }

    // Check if there's already a confirmed slot at this time
    const existingSlot = await db.availabilitySlot.findFirst({
      where: {
        contractorId,
        startTime,
        endTime,
        status: SlotStatus.CONFIRMED,
      },
    });

    if (existingSlot) {
      return {
        success: false,
        error: "This time slot is already confirmed",
      };
    }

    // Create the confirmed availability slot
    const { customAlphabet } = await import("nanoid");
    const cuid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);

    const availabilitySlot = await db.availabilitySlot.create({
      data: {
        id: cuid(),
        dayOfWeek: startTime.getDay(),
        startTime,
        endTime,
        contractorId,
        status: SlotStatus.CONFIRMED,
      },
    });

    console.log(
      "[approveTimeSlot] Created availability slot:",
      availabilitySlot
    );

    // Update the chat message to mark it as approved
    const updatedChat = await db.chat.update({
      where: { id: chatId },
      data: {
        text: `APPROVED_TIMESLOT::${JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          approvedAt: new Date().toISOString(),
          availabilitySlotId: availabilitySlot.id,
        })}`,
      },
    });

    console.log("[approveTimeSlot] Updated chat message:", updatedChat);

    return {
      success: true,
      availabilitySlot,
      updatedChat,
    };
  } catch (error) {
    console.error("[approveTimeSlot] Error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Get all scheduled appointments for a user
export async function getUserScheduledAppointments(userId: string) {
  try {
    // Use the same session checking approach as currentUser()
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return {
        success: false,
        error: "Unauthorized - No session",
      };
    }

    let sessionUserId: string;
    try {
      const result = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${sessionToken.value}`,
        }),
      });

      if (!result?.session?.userId || result.session.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      sessionUserId = result.session.userId;
    } catch (error) {
      console.error(
        "Error checking session in getUserScheduledAppointments:",
        error
      );
      return {
        success: false,
        error: "Unauthorized - Session error",
      };
    }

    // Get all conversations for this user
    const conversations = await db.conversation.findMany({
      where: {
        userId: userId,
      },
      include: {
        Contractor: {
          select: {
            id: true,
            name: true,
            specializations: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        Chat: {
          where: {
            text: {
              startsWith: "APPROVED_TIMESLOT::",
            },
            deleted: false,
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    // Parse all approved time slots
    const scheduledAppointments = conversations.flatMap((conversation) => {
      return conversation.Chat.map((chat) => {
        try {
          const jsonData = chat.text.replace("APPROVED_TIMESLOT::", "");
          const timeSlotData = JSON.parse(jsonData);

          return {
            id: chat.id,
            startTime: new Date(timeSlotData.startTime),
            endTime: new Date(timeSlotData.endTime),
            approvedAt: new Date(timeSlotData.approvedAt),
            availabilitySlotId: timeSlotData.availabilitySlotId,
            contractor: {
              id: conversation.Contractor.id,
              name: conversation.Contractor.name,
              specializations: conversation.Contractor.specializations,
              userName: conversation.Contractor.user?.name,
            },
            conversationId: conversation.id,
          };
        } catch (error) {
          console.error("Error parsing time slot data:", error);
          return null;
        }
      }).filter(
        (appointment): appointment is NonNullable<typeof appointment> =>
          appointment !== null
      );
    });

    // Sort by start time
    scheduledAppointments.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    return {
      success: true,
      appointments: scheduledAppointments,
    };
  } catch (error) {
    console.error("Error fetching scheduled appointments:", error);
    return {
      success: false,
      error: "Failed to fetch scheduled appointments",
    };
  }
}
```

---

### `prisma/schema.prisma`

**Path**: `prisma/schema.prisma`  
**Description**: Complete Prisma database schema showing User, Session, Account, Contractor, and all related models. Critical for understanding the data structure your React Native app will interact with.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String    @id @default(cuid())
  name               String?
  email              String?   @unique
  emailVerified      DateTime? @map("email_verified")
  image              String?
  role               UserRole  @default(USER)
  isTwoFactorEnabled Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  imageId            String?
  updatesId          String?

  // Better Auth specific fields
  banned     Boolean   @default(false)
  banReason  String?
  banExpires DateTime?

  // Relations
  accounts              Account[]
  sessions              Session[] // Better Auth sessions
  Chat                  Chat[]
  contacts              Contact[]              @relation("UserContacts")
  contractor            Contractor?            @relation("UserContractorRelation")
  Conversation          Conversation[]
  updates               Updates?               @relation("UserUpdates")
  twoFactorConfirmation twoFactorConfirmation?
  favorites             Favorite[]
  subscriptions         Subscription[]         @relation("UserSubscriptions")
  payments              Payment[]              @relation("UserPayments")
  collaborations        Collaboration[]
  collaborationMessages CollaborationMessage[]
  projects              Project[]
}

// Better Auth Session model
model Session {
  id             String   @id @default(cuid())
  expiresAt      DateTime
  token          String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  ipAddress      String?
  userAgent      String?
  userId         String
  impersonatedBy String? // For admin impersonation

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Better Auth JWKS model for JWT functionality
model Jwks {
  id         String   @id @default(cuid())
  publicKey  String
  privateKey String
  createdAt  DateTime @default(now())
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String // Better Auth expects this field
  providerId            String // Better Auth expects this field
  password              String? // Add password field for credential accounts
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Updates {
  id           String   @id @default(cuid())
  email        String?  @unique
  password     String?
  phone        String?
  update_token String?  @unique
  updatedAt    DateTime @updatedAt
  userId       String   @unique
  user         User     @relation("UserUpdates", fields: [userId], references: [id], onDelete: Cascade)
}

// Better Auth Verification model
model verification {
  id         String   @id @default(cuid())
  value      String   @unique // This is the token
  identifier String // This is the email
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
}

model PasswordResetToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model TwoFactorToken {
  id      String   @id @default(cuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model twoFactorConfirmation {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Location {
  latitude  Float
  longitude Float
  createdAt DateTime @default(now())
  id        Int      @id @default(autoincrement())
}

model Post {
  id         Int      @id @default(autoincrement())
  title      String
  content    String
  category   String
  datePosted DateTime @default(now())
  latitude   Float
  longitude  Float
  createdAt  DateTime @default(now())
}

model Contact {
  id     String @id @default(cuid())
  name   String
  email  String @unique
  userId String
  user   User   @relation("UserContacts", fields: [userId], references: [id], onDelete: Cascade)
}

model Contractor {
  id                        Int                        @id @default(autoincrement())
  datePosted                DateTime                   @default(now())
  confirmed                 Boolean                    @default(false)
  address                   String
  availability              String                     @default("")
  certifications            String[]
  city                      String
  name                      String
  phone                     String
  rating                    Int
  yearsOfExperience         Int?
  description               String?
  contractorLatitude        Float
  contractorLongitude       Float
  userId                    String                     @unique
  imageId                   String?
  uid                       String                     @unique @default(cuid())
  specializations           String[]                   @default([])
  imageUrl                  String?
  backgroundImageUrl        String? // New field for contractor background image
  premiumPlacement          Boolean                    @default(false) // Premium placement feature
  placementTier             PlacementTier? // Premium placement tier
  placementExpiresAt        DateTime? // When premium placement expires
  selectedPosition          Int? // Specific position selected by contractor (1-8 for first row)
  availabilitySlots         AvailabilitySlot[]
  user                      User                       @relation("UserContractorRelation", fields: [userId], references: [id], onDelete: Cascade)
  Conversation              Conversation[]
  reviews                   Review[]
  favoritedBy               Favorite[]
  subscriptions             Subscription[]             @relation("ContractorSubscriptions")
  payments                  Payment[]                  @relation("ContractorPayments")
  collaborationParticipants CollaborationParticipant[]
  projectEstimates          ProjectEstimate[]
}

model Favorite {
  id           String     @id @default(cuid())
  userId       String
  contractorId Int
  createdAt    DateTime   @default(now())
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  contractor   Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)

  @@unique([userId, contractorId])
  @@index([userId])
  @@index([contractorId])
}

model AvailabilitySlot {
  id           String     @id @default(cuid())
  dayOfWeek    Int
  startTime    DateTime
  endTime      DateTime
  contractorId Int
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  status       SlotStatus
  contractor   Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)

  @@index([contractorId])
}

model Review {
  id           String     @id @default(cuid())
  rating       Int        @default(0)
  comment      String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  contractorId Int
  contractor   Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)
}

model Chat {
  id             String       @id
  subject        String
  text           String
  date           DateTime
  read           Boolean      @default(false)
  deleted        Boolean      @default(false)
  labels         String[]     @default([])
  sender_id      String?
  conversationId String
  Conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  User           User?        @relation(fields: [sender_id], references: [id])
}

model Conversation {
  id           String     @id
  userId       String
  contractorId Int
  startedAt    DateTime   @default(now())
  subject      String?
  Chat         Chat[]
  Contractor   Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)
  User         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([contractorId])
  @@index([userId])
}

enum UserRole {
  USER
  ADMIN
}

enum SlotStatus {
  UNAVAILABLE
  CONFIRMED
}

enum PlacementTier {
  CITY_FIRST // $100 - Always first in city
  PROFESSION_FIRST // $50 - First in profession
  TOP_FIVE // $30 - Top 5 positions
}

enum SubscriptionType {
  MONTHLY
  YEARLY
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model DeletedUser {
  id                 String    @id @default(cuid())
  originalUserId     String    @unique // Store the original user ID
  name               String?
  email              String?
  emailVerified      DateTime? @map("email_verified")
  image              String?
  role               UserRole  @default(USER)
  isTwoFactorEnabled Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  imageId            String?
  deletedAt          DateTime  @default(now())
  deletionReason     String?   @default("User requested deletion")

  // Link to deleted contractor if applicable
  deletedContractor DeletedContractor? @relation("DeletedUserContractorRelation")
}

model DeletedContractor {
  id                   Int      @id @default(autoincrement())
  originalContractorId Int      @unique // Store the original contractor ID
  originalUserId       String   @unique // Store the original user ID
  datePosted           DateTime
  confirmed            Boolean  @default(false)
  address              String
  availability         String   @default("")
  certifications       String[]
  city                 String
  name                 String
  phone                String
  rating               Int
  yearsOfExperience    Int?
  description          String?
  contractorLatitude   Float
  contractorLongitude  Float
  imageId              String?
  uid                  String
  specializations      String[] @default([])
  imageUrl             String?
  backgroundImageUrl   String? // New field for contractor background image
  deletedAt            DateTime @default(now())
  deletionReason       String?  @default("User requested deletion")

  // Link to deleted user
  deletedUser DeletedUser @relation("DeletedUserContractorRelation", fields: [originalUserId], references: [originalUserId], onDelete: Cascade)
}

model Subscription {
  id                   String           @id @default(cuid())
  userId               String
  contractorId         Int
  stripeSubscriptionId String?          @unique
  placementTier        PlacementTier
  subscriptionType     SubscriptionType
  status               String           @default("active")
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  // Relations
  user       User       @relation("UserSubscriptions", fields: [userId], references: [id], onDelete: Cascade)
  contractor Contractor @relation("ContractorSubscriptions", fields: [contractorId], references: [id], onDelete: Cascade)
  payments   Payment[]  @relation("SubscriptionPayments")

  @@index([userId])
  @@index([contractorId])
  @@index([stripeSubscriptionId])
}

model Payment {
  id               String           @id @default(cuid())
  userId           String
  contractorId     Int?
  subscriptionId   String?
  stripePaymentId  String           @unique
  amount           Int // Amount in cents
  currency         String           @default("usd")
  status           PaymentStatus
  placementTier    PlacementTier
  subscriptionType SubscriptionType @default(MONTHLY)
  description      String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relations
  user         User          @relation("UserPayments", fields: [userId], references: [id], onDelete: Cascade)
  contractor   Contractor?   @relation("ContractorPayments", fields: [contractorId], references: [id], onDelete: SetNull)
  subscription Subscription? @relation("SubscriptionPayments", fields: [subscriptionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([stripePaymentId])
}

// New models for contractor collaborations (contractor-only group chats)
model Collaboration {
  id           String                     @id @default(cuid())
  title        String?
  createdAt    DateTime                   @default(now())
  createdById  String
  createdBy    User                       @relation(fields: [createdById], references: [id], onDelete: Cascade)
  participants CollaborationParticipant[]
  messages     CollaborationMessage[]
  projects     Project[]

  @@index([createdById])
}

model CollaborationParticipant {
  id              String   @id @default(cuid())
  collaborationId String
  contractorId    Int
  joinedAt        DateTime @default(now())

  collaboration Collaboration @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  contractor    Contractor    @relation(fields: [contractorId], references: [id], onDelete: Cascade)

  @@unique([collaborationId, contractorId])
  @@index([contractorId])
}

model CollaborationMessage {
  id              String   @id @default(cuid())
  collaborationId String
  senderUserId    String
  text            String
  date            DateTime @default(now())
  deleted         Boolean  @default(false)

  collaboration Collaboration @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  sender        User          @relation(fields: [senderUserId], references: [id], onDelete: Cascade)

  @@index([collaborationId])
  @@index([senderUserId])
}

// New models for user-opened remodel projects
model Project {
  id              String            @id @default(cuid())
  title           String
  description     String?
  createdAt       DateTime          @default(now())
  status          ProjectStatus     @default(OPEN)
  createdByUserId String
  createdBy       User              @relation(fields: [createdByUserId], references: [id], onDelete: Cascade)
  collaborationId String?
  collaboration   Collaboration?    @relation(fields: [collaborationId], references: [id], onDelete: SetNull)
  estimates       ProjectEstimate[]

  @@index([createdByUserId])
  @@index([status])
}

model ProjectEstimate {
  id           String   @id @default(cuid())
  projectId    String
  contractorId Int
  amount       Int
  currency     String   @default("usd")
  notes        String?
  createdAt    DateTime @default(now())

  project    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  contractor Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)

  @@unique([projectId, contractorId])
  @@index([projectId])
  @@index([contractorId])
}

enum ProjectStatus {
  OPEN
  ASSIGNED
  CLOSED
}
```

---

### `lib/db.ts`

**Path**: `lib/db.ts`  
**Description**: Prisma client setup with middleware to handle Better Auth field mappings and prevent hot-reload issues in development.

```ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with middleware to handle Better Auth field mappings
const createPrismaClient = () => {
  const client = new PrismaClient();
  
  // Middleware to fix Better Auth field mismatches with Prisma schema
  client.$use(async (params, next) => {
    if (params.model === 'User' && (params.action === 'create' || params.action === 'update')) {
      // Fix 1: Convert emailVerified: false to null (schema expects DateTime | null)
      if (params.args.data?.emailVerified === false) {
        params.args.data.emailVerified = null;
      }
      
      // Fix 2: Convert twoFactorEnabled to isTwoFactorEnabled (field name mismatch)
      if ('twoFactorEnabled' in (params.args.data || {})) {
        params.args.data.isTwoFactorEnabled = params.args.data.twoFactorEnabled;
        delete params.args.data.twoFactorEnabled;
      }
    }
    return next(params);
  });
  
  return client;
};

//basically so prisma can be used in the global scope if it is not already running
//because next.js hot reload does with prima... to many running for every hot reload
export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
```

---

### `routes.ts`

**Path**: `routes.ts`  
**Description**: Route configuration defining public routes, auth routes, and the API auth prefix. Includes optimized route checking functions.

```ts
//routes.ts
/** These routes are publicly accessible
 */
export const publicRoutes = [
  "/",
  "/auth/new-verification",
  "/chat",
  "/fr/chat",
  "/sl/chat",
  "/de/chat",
  "/en/hometwo",
  "/en/home",
  "/fr/home",
  "/sl/home",
  "/de/home",
  "/post",
  "/authentication",
  "/en/auth/login",
  "/fr/auth/login",
  "/sl/auth/login",
  "/de/auth/login",
  "/en/auth/register",
  "/fr/auth/register",
  "/sl/auth/register",
  "/de/auth/register",
  "/en/location",
  "/fr/location",
  "/sl/location",
  "/de/location",
  "/en/test-translations",
  "/fr/test-translations",
  "/sl/test-translations",
  "/de/test-translations",
  "/en/auth/new-password",
];

/** These routes need authentication and will redirect loged in users to /settings.
 *@type {string[]}
 */
export const authRoutes = [
  "/en",
  "/fr",
  "/sl",
  "/de",
  "/auth/login",
  "/en/auth/register",
  "/fr/auth/register",
  "/sl/auth/register",
  "/de/auth/register",
  "/en/auth/login",
  "/fr/auth/login",
  "/sl/auth/login",
  "/de/auth/login",
  "/auth/error",
  "/en/auth/reset",
  "/fr/auth/reset",
  "/sl/auth/reset",
  "/de/auth/reset",
  "/auth/new-password",
  "/en/auth/new-verification",
  "/fr/auth/new-verification",
  "/sl/auth/new-verification",
  "/de/auth/new-verification",
  "/en/auth/contractor-onboarding",
  "/fr/auth/contractor-onboarding",
  "/sl/auth/contractor-onboarding",
  "/de/auth/contractor-onboarding",
  // "/auth/forgot-password",
  // "/auth/reset-password/:token
];

// Optimized route checking functions
export function isPublicRoute(pathname: string): boolean {
  // Fast path checks for common routes
  if (
    pathname === "/" ||
    pathname === "/post" ||
    pathname === "/authentication"
  ) {
    return true;
  }

  // Pattern matching for internationalized routes
  const homePattern = /^\/(en|fr|sl|de)\/home$/;
  const chatPattern = /^\/(en|fr|sl|de)?\/chat/;
  const locationPattern = /^\/(en|fr|sl|de)\/location$/;
  const testPattern = /^\/(en|fr|sl|de)\/test-translations$/;

  return (
    homePattern.test(pathname) ||
    chatPattern.test(pathname) ||
    locationPattern.test(pathname) ||
    testPattern.test(pathname) ||
    pathname === "/auth/new-verification"
  );
}

export function isAuthRoute(pathname: string): boolean {
  // Fast path checks
  if (
    pathname === "/auth/login" ||
    pathname === "/auth/error" ||
    pathname === "/auth/new-password"
  ) {
    return true;
  }

  // Pattern matching for internationalized auth routes
  const rootLocalePattern = /^\/(en|fr|sl|de)$/;
  const loginPattern = /^\/(en|fr|sl|de)\/auth\/login$/;
  const registerPattern = /^\/(en|fr|sl|de)\/auth\/register$/;
  const resetPattern = /^\/(en|fr|sl|de)\/auth\/reset$/;
  const verificationPattern = /^\/(en|fr|sl|de)\/auth\/new-verification$/;
  const onboardingPattern = /^\/(en|fr|sl|de)\/auth\/contractor-onboarding$/;

  return (
    rootLocalePattern.test(pathname) ||
    loginPattern.test(pathname) ||
    registerPattern.test(pathname) ||
    resetPattern.test(pathname) ||
    verificationPattern.test(pathname) ||
    onboardingPattern.test(pathname)
  );
}

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for Api authentication
 * @type {string}
 */
export const apiAuthPrefix = "/en/api/auth";

/**
 * The default redirect path after logging in - possibly change this to dashboard
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/home";
```

---

### `package.json` (Key Dependencies)

**Path**: `package.json`  
**Description**: Key npm dependencies for Better Auth and mobile support. Highlights important packages your React Native app should be aware of.

```json
{
  "dependencies": {
    "@better-auth/expo": "^1.3.8",
    "better-auth": "^1.3.6",
    "@prisma/client": "^6.8.2",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "next": "^15.2.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "stripe": "^18.4.0",
    "zod": "^3.25.23"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^22",
    "prisma": "^6.8.2",
    "typescript": "^5"
  }
}
```

---

### Environment Variables Reference

**Description**: Complete list of environment variables needed for Better Auth configuration in your backend. Your React Native app will primarily need to know the `BETTER_AUTH_URL` and mobile-specific values.

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Better Auth Configuration
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.com"

# JWT Secrets (CRITICAL - keep these secure)
JWT_SECRET="your-strong-jwt-secret-key"
REFRESH_TOKEN_SECRET="your-strong-refresh-token-secret"

# OAuth Providers (for social login)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Expo/Mobile Configuration
EXPO_SCHEME="myapp"  # Your app's deep link scheme
EXPO_PUBLIC_BASE_URL="https://your-domain.com"

# CORS Configuration (for mobile API)
CORS_ORIGIN="http://localhost:8081"  # Your React Native dev server

# Email Service (Mailgun for verification/reset emails)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
MAILGUN_FROM_EMAIL="noreply@yourdomain.com"

# Stripe (for premium features/payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Node Environment
NODE_ENV="development"  # or "production"
```

---

## React Native Integration Checklist

### API Endpoints Your RN App Should Call

1. **`POST /api/mobile/auth/login`** - Email/password login
2. **`POST /api/mobile/auth/register`** - User registration
3. **`POST /api/mobile/auth/reset-password`** - Send password reset email
4. **`PATCH /api/mobile/auth/reset-password`** - Complete password reset with token
5. **`GET /api/auth/session`** (Better Auth native) - Get current session
6. **`POST /api/auth/sign-out`** (Better Auth native) - Sign out

### Token Management

- Store `accessToken` and `refreshToken` securely (e.g., using `expo-secure-store`)
- Access tokens expire in **20 seconds** (see `lib/jwt.ts` line 24)
- Refresh tokens expire in **30 days** (see `lib/jwt.ts` line 34)
- Include `Authorization: Bearer <accessToken>` header for authenticated requests
- Implement token refresh logic before access token expires

### User Data Structure

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  isContractor: boolean;
  emailVerified: Date | null;
  image?: string;
}
```

### Key Implementation Notes

1. **Session Storage**: Better Auth uses cookies for web; for RN you'll use JWT tokens
2. **CORS**: Ensure your RN dev/prod IPs are in `CORS_ORIGIN` environment variable
3. **Email Verification**: Users must verify email before login (see `auth.ts` line 72)
4. **2FA Support**: Optional 2FA is available via the `twoFactor` plugin
5. **Deep Links**: Configure your Expo app's scheme to match `EXPO_SCHEME` env variable

---

**End of Mobile Better Auth Reference Bundle**

