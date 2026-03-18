# Role Switch Endpoint - Backend Implementation Required

## Problem

The mobile app is trying to call `POST /api/auth/switch-role` but receives a 404 error because the endpoint doesn't exist in the Next.js backend.

## Overview

Users who have both a regular user account and a contractor profile can switch between two modes:
- **User Mode**: Default mode for browsing contractors, messaging, etc.
- **Contractor Mode**: Access to contractor-specific features like analytics, projects, collaborations

The role preference is stored in a secure cookie (`session-role`) and persists across app sessions.

## Required Backend Endpoint

### `POST /api/auth/switch-role`

**File:** `app/api/auth/switch-role/route.ts`

**Purpose:** Switch user's active role between "user" and "contractor" modes

**Request Body:**
```typescript
{
  role: "user" | "contractor"
}
```

**Response:**
```typescript
{
  success: boolean;
  role?: "user" | "contractor";
  message?: string;
  error?: string;
}
```

## Implementation

### Basic Implementation

```typescript
// app/api/auth/switch-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

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
    // Get authorization header for mobile app
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      // Mobile app authentication - verify JWT token
      const token = authHeader.substring(7);
      
      // Verify token and get user ID
      // Adjust based on your JWT implementation
      const decoded = await verifyMobileToken(token);
      userId = decoded?.userId || null;
    } else {
      // Web app authentication - use Better Auth session
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      userId = session?.user?.id || null;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { role } = await req.json();

    // Validate role
    if (role !== "user" && role !== "contractor") {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'user' or 'contractor'" },
        { status: 400 }
      );
    }

    // If switching to contractor, verify contractor profile exists and is confirmed
    if (role === "contractor") {
      const contractor = await db.contractor.findFirst({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          confirmed: true,
        },
      });

      if (!contractor) {
        return NextResponse.json(
          {
            success: false,
            error: "No contractor profile found. Please create a contractor profile first.",
          },
          { status: 404 }
        );
      }

      if (!contractor.confirmed) {
        return NextResponse.json(
          {
            success: false,
            error: "Your contractor profile is not yet confirmed. Please complete your profile verification.",
          },
          { status: 403 }
        );
      }
    }

    // Set session-role cookie
    const cookieStore = await cookies();
    cookieStore.set("session-role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        role,
        message: `Successfully switched to ${role} mode`,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Role switch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to switch role",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
```

### Alternative: Using Better Auth Session

If you're using Better Auth and want to leverage its session management:

```typescript
// app/api/auth/switch-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

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
    // Get session - works for both web and mobile
    const authHeader = req.headers.get("authorization");
    let session;

    if (authHeader?.startsWith("Bearer ")) {
      // Mobile app - verify token and get session
      const token = authHeader.substring(7);
      session = await auth.api.getSession({
        headers: new Headers({
          authorization: `Bearer ${token}`,
        }),
      });
    } else {
      // Web app - use cookie-based session
      session = await auth.api.getSession({
        headers: req.headers,
      });
    }

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { role } = await req.json();

    // Validate role
    if (role !== "user" && role !== "contractor") {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // If switching to contractor, verify contractor profile exists and is confirmed
    if (role === "contractor") {
      const contractor = await db.contractor.findFirst({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          confirmed: true,
        },
      });

      if (!contractor) {
        return NextResponse.json(
          {
            success: false,
            error: "No contractor profile found",
          },
          { status: 404 }
        );
      }

      if (!contractor.confirmed) {
        return NextResponse.json(
          {
            success: false,
            error: "Contractor profile not confirmed",
          },
          { status: 403 }
        );
      }
    }

    // Set session-role cookie
    const cookieStore = await cookies();
    cookieStore.set("session-role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        role,
        message: `Successfully switched to ${role} mode`,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("Role switch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to switch role",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
```

## Update Session Endpoint

The `/api/auth/session` endpoint should read the `session-role` cookie and return `isContractor` accordingly:

```typescript
// In your /api/auth/session route.ts
export async function GET(req: NextRequest) {
  // ... existing session logic ...

  const cookieStore = await cookies();
  const sessionRole = cookieStore.get("session-role")?.value || "user";
  
  // Set isContractor based on session-role cookie
  if (user) {
    (user as any).isContractor = sessionRole === "contractor";
  }

  return NextResponse.json({ user });
}
```

## Cookie Configuration

The `session-role` cookie should be:
- **Name:** `session-role`
- **Value:** `"user"` or `"contractor"`
- **httpOnly:** `true` (for security)
- **secure:** `true` in production (HTTPS only)
- **sameSite:** `"lax"` (allows cross-site requests from mobile app)
- **maxAge:** `604800` (7 days in seconds)
- **path:** `"/"`

## Error Responses

The endpoint should return appropriate HTTP status codes:

- **200 OK**: Role switch successful
- **400 Bad Request**: Invalid role value
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: Contractor profile exists but not confirmed
- **404 Not Found**: No contractor profile found (when switching to contractor)
- **500 Internal Server Error**: Server error

## Testing

### Test with curl:

```bash
# Switch to contractor mode
curl -X POST http://localhost:3000/api/auth/switch-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"role":"contractor"}'

# Switch to user mode
curl -X POST http://localhost:3000/api/auth/switch-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"role":"user"}'
```

### Expected Response (Success):

```json
{
  "success": true,
  "role": "contractor",
  "message": "Successfully switched to contractor mode"
}
```

### Expected Response (Error - No Profile):

```json
{
  "success": false,
  "error": "No contractor profile found. Please create a contractor profile first."
}
```

### Expected Response (Error - Not Confirmed):

```json
{
  "success": false,
  "error": "Your contractor profile is not yet confirmed. Please complete your profile verification."
}
```

## Integration with Existing Auth

The role switch endpoint should work alongside your existing authentication:

1. **Mobile App**: Uses JWT tokens in `Authorization: Bearer <token>` header
2. **Web App**: Uses Better Auth session cookies
3. **Cookie Management**: The `session-role` cookie is set server-side and read by the session endpoint

## Notes

- The `session-role` cookie is separate from authentication - it only indicates the user's preferred mode
- Users must be authenticated to switch roles
- The cookie persists across app restarts and browser sessions
- The mobile app doesn't need to manage the cookie directly - axios handles it automatically
- Always validate that a contractor profile exists and is confirmed before allowing switch to contractor mode

## Related Files

- Mobile app hook: `lib/useRoleSwitch.ts`
- Mobile app component: `components/RoleSwitchButton.tsx`
- Mobile app API: `api/authapi.tsx` (switchRoleApi function)
- Session endpoint: `app/api/auth/session/route.ts` (should read session-role cookie)
