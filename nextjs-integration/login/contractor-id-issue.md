# Contractor Profile Missing After Login - Backend Fix Required

## Problem Description

When a contractor logs in via the mobile app, the login response includes `contractorId` but **not** the full `contractor` profile object. This causes the `ContractorRouteGuard` to deny access with the error:

```
Access Denied
No contractor profile found. Please complete contractor onboarding.
```

## Root Cause

The mobile app's `useContractorAccess()` hook checks for `user.contractor` (a full `ContractorProfile` object), but:

1. **Login endpoint** (`/api/mobile/auth/login`) returns only `contractorId: 11` in the user object
2. **Session endpoint** (`/api/auth/session`) also doesn't include the contractor profile

The mobile app expects the user object to have this structure:

```typescript
{
  id: string;
  email: string;
  isContractor: true;
  contractorId: 11;
  contractor: {  // ← This is missing!
    id: number;
    uid: string;
    name: string;
    specializations: string[];
    city: string;
    rating: number;
    confirmed: boolean;
  }
}
```

## Required Backend Changes

### 1. Update `/api/mobile/auth/login` Endpoint

**File:** `app/api/mobile/auth/login/route.ts`

After Better Auth authentication succeeds, fetch and attach the contractor profile if the user has a `contractorId`.

```typescript
// app/api/mobile/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
    const { email, password, loginAs } = await req.json();

    // Call Better Auth signInEmail
    const result = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    const resBody = await result.clone().json();
    
    // If login successful and user has contractorId, fetch contractor profile
    if (resBody.user && resBody.user.contractorId) {
      const contractor = await db.contractor.findUnique({
        where: { id: resBody.user.contractorId },
        select: {
          id: true,
          userId: true,
          name: true,
          specializations: true,
          city: true,
          rating: true,
          confirmed: true,
        },
      });

      // Attach contractor profile to user object
      if (contractor) {
        resBody.user.contractor = {
          id: contractor.id,
          uid: contractor.userId,
          name: contractor.name,
          specializations: contractor.specializations,
          city: contractor.city,
          rating: contractor.rating,
          confirmed: contractor.confirmed,
        };
      }
    }

    const response = new NextResponse(JSON.stringify(resBody), {
      status: result.status,
    });

    // Forward set-cookie headers if present
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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
```

### 2. Update `/api/auth/session` Endpoint

**File:** `app/api/auth/session/route.ts`

This endpoint is called by the mobile app's `getSession()` method. It must also include the contractor profile.

```typescript
// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get session using Better Auth
    // Note: Better Auth may have its own session verification
    // Adjust this based on your Better Auth setup
    const session = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${token}`,
      }),
    });

    if (!session?.user) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const user = session.user;

    // If user has contractorId, fetch contractor profile
    if (user.contractorId) {
      const contractor = await db.contractor.findUnique({
        where: { id: user.contractorId },
        select: {
          id: true,
          userId: true,
          name: true,
          specializations: true,
          city: true,
          rating: true,
          confirmed: true,
        },
      });

      // Attach contractor profile to user object
      if (contractor) {
        (user as any).contractor = {
          id: contractor.id,
          uid: contractor.userId,
          name: contractor.name,
          specializations: contractor.specializations,
          city: contractor.city,
          rating: contractor.rating,
          confirmed: contractor.confirmed,
        };
      }
    }

    const response = NextResponse.json({ user });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
  } catch (error: any) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { user: null, error: "Session verification failed" },
      { status: 500 }
    );
  }
}
```

### Alternative: Using Better Auth's Built-in Session

If Better Auth already handles session verification differently, you may need to:

1. **Extract user ID from JWT token** and query the database directly
2. **Use Better Auth's user lookup** and then enrich with contractor data

Here's an alternative approach if Better Auth provides a different API:

```typescript
// Alternative: If Better Auth has a different session API
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token and get user ID (adjust based on your JWT implementation)
    // This assumes you have a verifyMobileToken function
    const decoded = await verifyMobileToken(token);
    
    if (!decoded?.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        image: true,
        role: true,
        isTwoFactorEnabled: true,
        contractorId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch contractor profile if contractorId exists
    if (user.contractorId) {
      const contractor = await db.contractor.findUnique({
        where: { id: user.contractorId },
        select: {
          id: true,
          userId: true,
          name: true,
          specializations: true,
          city: true,
          rating: true,
          confirmed: true,
        },
      });

      if (contractor) {
        (user as any).contractor = {
          id: contractor.id,
          uid: contractor.userId,
          name: contractor.name,
          specializations: contractor.specializations,
          city: contractor.city,
          rating: contractor.rating,
          confirmed: contractor.confirmed,
        };
        (user as any).isContractor = true;
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
```

## Expected Response Format

After implementing these changes, both endpoints should return:

```json
{
  "user": {
    "id": "o2YBKazkteW5hHjoKa1Y7FHS2dfmPWG0",
    "email": "handytest753@gmail.com",
    "name": "test",
    "isContractor": true,
    "contractorId": 11,
    "contractor": {
      "id": 11,
      "uid": "o2YBKazkteW5hHjoKa1Y7FHS2dfmPWG0",
      "name": "Contractor Name",
      "specializations": ["plumbing", "electrical"],
      "city": "Miami",
      "rating": 4.5,
      "confirmed": true
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Testing

After implementing:

1. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/mobile/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"handytest753@gmail.com","password":"password","loginAs":"contractor"}'
   ```
   
   Verify the response includes `user.contractor` object.

2. **Test Session:**
   ```bash
   curl -X GET http://localhost:3000/api/auth/session \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```
   
   Verify the response includes `user.contractor` object.

## Mobile App Contract

The mobile app expects the `User` type to match:

```typescript
export type User = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image?: string | null;
  role: "USER" | "ADMIN";
  isTwoFactorEnabled: boolean;
  isContractor: boolean;
  contractorId?: number;  // Optional, but should be present if isContractor is true
  contractor?: ContractorProfile | null;  // Required if contractorId exists
};

export interface ContractorProfile {
  id: number;
  uid: string;
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  confirmed: boolean;
}
```

## Notes

- The `contractorId` field may be stored in the `User` model or in a separate `Contractor` model with a `userId` foreign key
- Adjust the Prisma query based on your actual schema
- Ensure the `confirmed` field is checked by the mobile app's `ContractorRouteGuard`
- The contractor profile should only be included if `confirmed: true` (or handle unconfirmed profiles appropriately)
