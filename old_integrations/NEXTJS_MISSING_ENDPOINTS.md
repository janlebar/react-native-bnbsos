# Next.js Backend - Missing Endpoints for React Native App

This document lists all the API endpoints that need to be implemented in the Next.js backend for full React Native mobile app integration with Better Auth.

## Authentication Endpoints ✅ (Reference Implementation)

Based on `mobile-better-auth.md`, these endpoints **proxy Better Auth responses directly**:

- ✅ `POST /api/mobile/auth/login` - Email/password login (proxies Better Auth)
- ✅ `POST /api/mobile/auth/register` - User registration (proxies Better Auth)
- ✅ `POST /api/mobile/auth/reset-password` - Request password reset email (proxies Better Auth)
- ✅ `PATCH /api/mobile/auth/reset-password` - Complete password reset with token (proxies Better Auth)
- ✅ `GET /api/auth/session` - Get current session (Better Auth native)
- ✅ `POST /api/auth/sign-out` - Sign out (Better Auth native)

**Important:** These endpoints use `asResponse: true` to proxy Better Auth's response directly. Better Auth's JWT plugin will include tokens in the response format:
```json
{
  "user": { ... },
  "session": { ... },
  "token": "jwt_access_token",  // From JWT plugin
  "refreshToken": "jwt_refresh_token"  // From JWT plugin (if configured)
}
```

## 🔴 MISSING: Token Refresh Endpoint

### `POST /api/mobile/auth/refresh`

**Purpose**: Refresh expired access tokens using refresh token

**Location**: Create `app/api/mobile/auth/refresh/route.ts`

**Request Body**:
```typescript
{
  refreshToken: string
}
```

**Response**:
```typescript
{
  token: string,           // New access token
  refreshToken?: string    // New refresh token (optional)
}
```

**Implementation Example**:

**Note:** Better Auth with JWT plugin may provide its own refresh endpoint. Check if `/api/auth/refresh` exists. If not, use this custom implementation:

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
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate new access token
    const newAccessToken = generateMobileToken({
      userId: user.id,
      email: user.email!,
      isContractor: !!user.contractor,
    });

    // Optionally generate new refresh token (for rotation)
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
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );
  }
}
```

---

## 🔴 MISSING: Contractor API Endpoints

### `GET /api/mobile/contractors`

**Purpose**: Get contractors by location and profession (with auth-aware data filtering)

**Location**: Create `app/api/mobile/contractors/route.ts`

**Query Parameters**:
- `location` (string): City/location name
- `profession` (string): Comma-separated list of professions

**Response**: Array of contractors with phone/email hidden for unauthenticated users

**Implementation Notes**:
- Use existing `actions/contractors.ts` → `getContractorsByLocationAndProfession`
- Add JWT token verification
- Filter sensitive data based on authentication status

**Implementation Example**:
```typescript
// app/api/mobile/contractors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/jwt";
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
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "";
    const professionParam = searchParams.get("profession") || "";
    const profession = professionParam.split(",").filter(Boolean);

    if (!profession.length) {
      return NextResponse.json(
        { error: "Profession parameter required" },
        { status: 400 }
      );
    }

    // Check authentication
    let isAuthenticated = false;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        verifyMobileToken(token);
        isAuthenticated = true;
      } catch (e) {
        // Token invalid or expired
        isAuthenticated = false;
      }
    }

    // Fetch contractors
    const contractors = await db.contractor.findMany({
      where: {
        OR: [
          // Exact city match
          {
            city: location,
            OR: [
              { certifications: { hasSome: profession } },
              { specializations: { hasSome: profession } },
            ],
          },
          // Fuzzy city match
          {
            city: {
              contains: location,
              mode: "insensitive",
            },
            OR: [
              { certifications: { hasSome: profession } },
              { specializations: { hasSome: profession } },
            ],
          },
        ],
      },
      orderBy: [
        { rating: "desc" },
        { datePosted: "desc" },
      ],
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Transform data based on authentication
    const transformedContractors = contractors.map((contractor) => ({
      ...contractor,
      uid: contractor.userId,
      user: {
        email: isAuthenticated ? contractor.user?.email : null,
      },
      phone: isAuthenticated ? contractor.phone : "",
    }));

    const response = NextResponse.json(transformedContractors);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error: any) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}
```

---

### `GET /api/mobile/contractors/[id]`

**Purpose**: Get single contractor by ID

**Location**: Create `app/api/mobile/contractors/[id]/route.ts`

**Response**: Contractor details with auth-aware data filtering

**Implementation Notes**:
- Use existing `actions/contractors.ts` → `getContractorById`
- Add JWT token verification
- Filter sensitive data based on authentication

---

## 🔴 MISSING: Chat/Conversation API Endpoints

The Next.js app has Prisma models for `Conversation` and `Chat`, but no mobile API endpoints. Based on `chatapi.tsx` in React Native, these are needed:

### `GET /api/mobile/chat/conversations`

**Purpose**: Get all conversations for current user

**Location**: Create `app/api/mobile/chat/conversations/route.ts`

**Authentication**: Required (JWT Bearer token)

**Response**:
```typescript
Array<{
  id: string;
  userId: string;
  contractorId: number;
  startedAt: string;
  subject: string | null;
  Chat: ChatMessage[];
  Contractor: {
    id: number;
    name: string;
    city: string;
    specializations: string[];
    rating: number;
    imageUrl?: string | null;
  };
  User: {
    id: string;
    name: string | null;
    email: string | null;
  };
}>
```

**Implementation Example**:
```typescript
// app/api/mobile/chat/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyMobileToken(token);

    // Fetch conversations
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { userId: payload.userId },
          {
            Contractor: {
              userId: payload.userId,
            },
          },
        ],
      },
      include: {
        Chat: {
          where: { deleted: false },
          orderBy: { date: "desc" },
        },
        Contractor: {
          select: {
            id: true,
            name: true,
            city: true,
            specializations: true,
            rating: true,
            imageUrl: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
```

---

### `GET /api/mobile/chat/conversations/[id]`

**Purpose**: Get specific conversation with all messages

**Location**: Create `app/api/mobile/chat/conversations/[id]/route.ts`

**Authentication**: Required

**Response**: Single conversation object with all messages

---

### `POST /api/mobile/chat/conversations`

**Purpose**: Create new conversation between user and contractor

**Location**: Add to `app/api/mobile/chat/conversations/route.ts`

**Request Body**:
```typescript
{
  contractorId: number,
  subject?: string
}
```

**Response**: Created conversation object

**Implementation**:
```typescript
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyMobileToken(token);

    const { contractorId, subject } = await req.json();

    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        userId: payload.userId,
        contractorId,
      },
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation
    const { customAlphabet } = await import("nanoid");
    const cuid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);

    const conversation = await db.conversation.create({
      data: {
        id: cuid(),
        userId: payload.userId,
        contractorId,
        subject: subject || "New Conversation",
      },
      include: {
        Chat: true,
        Contractor: {
          select: {
            id: true,
            name: true,
            city: true,
            specializations: true,
            rating: true,
            imageUrl: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
```

---

### `GET /api/mobile/chat/contacts`

**Purpose**: Get all contacts (people user has conversations with)

**Location**: Create `app/api/mobile/chat/contacts/route.ts`

**Authentication**: Required

**Response**: Array of contacts with last message and unread count

---

### `POST /api/mobile/chat/messages`

**Purpose**: Send a message in a conversation

**Location**: Create `app/api/mobile/chat/messages/route.ts`

**Request Body**:
```typescript
{
  conversationId: string,
  text: string,
  subject?: string
}
```

**Response**: Created message object

**Implementation Example**:
```typescript
// app/api/mobile/chat/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyMobileToken(token);

    const { conversationId, text, subject } = await req.json();

    // Verify conversation exists and user has access
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: payload.userId },
          {
            Contractor: {
              userId: payload.userId,
            },
          },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Create message
    const { customAlphabet } = await import("nanoid");
    const cuid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);

    const message = await db.chat.create({
      data: {
        id: cuid(),
        conversationId,
        sender_id: payload.userId,
        text,
        subject: subject || "Message",
        date: new Date(),
        read: false,
        deleted: false,
        labels: [],
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
```

---

### `PUT /api/mobile/chat/conversations/[id]/read`

**Purpose**: Mark all messages in a conversation as read

**Location**: Create `app/api/mobile/chat/conversations/[id]/read/route.ts`

**Authentication**: Required

**Response**: Success message

---

### `DELETE /api/mobile/chat/messages/[id]`

**Purpose**: Delete (soft delete) a message

**Location**: Create `app/api/mobile/chat/messages/[id]/route.ts`

**Authentication**: Required

**Response**: Success message

---

### `GET /api/mobile/chat/unread-count`

**Purpose**: Get count of unread messages for current user

**Location**: Create `app/api/mobile/chat/unread-count/route.ts`

**Authentication**: Required

**Response**:
```typescript
{
  count: number
}
```

---

## Summary of Missing Endpoints

### Critical (Required for Basic Functionality)

1. ✅ **HIGHEST PRIORITY** - `POST /api/mobile/auth/refresh` - Token refresh
2. ✅ **HIGH PRIORITY** - `GET /api/mobile/contractors` - List contractors
3. ✅ **HIGH PRIORITY** - `GET /api/mobile/chat/conversations` - List conversations
4. ✅ **HIGH PRIORITY** - `POST /api/mobile/chat/messages` - Send message
5. ✅ **HIGH PRIORITY** - `POST /api/mobile/chat/conversations` - Create conversation

### Important (Needed for Full Feature Set)

6. `GET /api/mobile/chat/contacts` - List contacts
7. `GET /api/mobile/chat/conversations/[id]` - Get conversation details
8. `GET /api/mobile/contractors/[id]` - Get contractor details
9. `PUT /api/mobile/chat/conversations/[id]/read` - Mark messages as read
10. `GET /api/mobile/chat/unread-count` - Unread message count

### Nice to Have

11. `DELETE /api/mobile/chat/messages/[id]` - Delete message
12. `GET /api/mobile/chat/conversations/search` - Search conversations

---

## Implementation Checklist

- [ ] Create `app/api/mobile/auth/refresh/route.ts`
- [ ] Create `app/api/mobile/contractors/route.ts`
- [ ] Create `app/api/mobile/contractors/[id]/route.ts`
- [ ] Create `app/api/mobile/chat/conversations/route.ts` (GET & POST)
- [ ] Create `app/api/mobile/chat/conversations/[id]/route.ts`
- [ ] Create `app/api/mobile/chat/messages/route.ts`
- [ ] Create `app/api/mobile/chat/messages/[id]/route.ts`
- [ ] Create `app/api/mobile/chat/contacts/route.ts`
- [ ] Create `app/api/mobile/chat/conversations/[id]/read/route.ts`
- [ ] Create `app/api/mobile/chat/unread-count/route.ts`

---

## JWT Helper Functions Needed

Make sure these functions exist in `lib/jwt.ts`:

```typescript
// Already exist based on mobile-better-auth.md:
- generateMobileToken()
- generateRefreshToken()
- verifyMobileToken()
- verifyRefreshToken()
- getUserFromToken()
- generateMobileAuthResponse()
```

---

## Testing Endpoints

Use these curl commands to test endpoints once implemented:

### Test Token Refresh
```bash
curl -X POST http://localhost:3000/api/mobile/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Test Get Contractors
```bash
curl -X GET "http://localhost:3000/api/mobile/contractors?location=Miami&profession=plumbing" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Get Conversations
```bash
curl -X GET http://localhost:3000/api/mobile/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Send Message
```bash
curl -X POST http://localhost:3000/api/mobile/chat/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"conv_123","text":"Hello!"}'
```
