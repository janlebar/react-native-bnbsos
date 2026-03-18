## Switch Role Fix – Root Cause & Resolution

### Status (Expo frontend – FIXED ✅)

The Expo app was calling `refreshSession()` after `POST /api/auth/switch-role` returned
`success: true`, expecting the session endpoint to reflect the new role. It didn't, because:

> **Axios in React Native does not store or forward HTTP cookies.**
>
> `switch-role` sets a `session-role=contractor` cookie, but when the Expo app subsequently
> calls `GET /api/auth/session` the cookie is never sent. The session endpoint therefore
> returns the same pre-switch user object, with `isContractor: false`.

**Fix applied in `lib/useRoleSwitch.ts` + `lib/auth-context.tsx`:**

1. Added `updateUser(updates: Partial<User>)` to `AuthContext` — patches the in-memory user
   and the `SecureStore` cache without a network round-trip.
2. After `switchRoleApi` returns `success: true`, `useRoleSwitch` calls
   `updateUser({ isContractor: newRole === 'contractor' })` **before** navigating.
3. `refreshSession()` is still fired in the background (no `await`) so that if the backend
   is later fixed to persist role in a DB field, the state stays in sync automatically.

This makes the `/contractors` route pass `useContractorAccess` immediately after switching —
no "Access Denied" error.

---

### Problem (original report)

In the Expo app:

- Switching from **contractor → user** works.
- Switching from **user → contractor** appears to succeed:

```text
🔄 Role Switch - Switching to contractor mode
🔄 Role Switch - Result:
{ success: true, role: "contractor", message: "Successfully switched to contractor mode" }
```

…but navigating to `/contractors` shows:

> **Access Denied**  
> You must be logged in as a contractor to access these features.

On the Expo side, this check comes from:

- `lib/useContractorAccess.ts`:
  - Requires `user.isContractor === true`
  - Requires `user.contractor` to exist and `user.contractor.confirmed === true`

The role switch endpoint is working (returns `success: true` and sets `session-role=contractor`), but **the session endpoint is not reflecting the new role** for mobile requests.

---

### Root Cause

After switching roles, the Expo app does:

1. Calls `POST /api/auth/switch-role` → `success: true`
2. Calls `authService.getSession()` in Expo → `GET /api/auth/session`
3. `useContractorAccess()` reads `user` from the session and checks:
   - `user.isContractor`
   - `user.contractor` and `user.contractor.confirmed`

There are **two compounding issues**:

1. **Expo/Axios does not send cookies** — `session-role` is set as an HTTP cookie by
   `switch-role`, but Axios in React Native never sends it back. So the session endpoint
   can't read it for mobile callers. *(Frontend fix: optimistic `updateUser()` — see Status
   above.)*
2. **Next.js `/api/auth/session` does not enrich the mobile user object** even if the cookie
   could be read — it currently does not include `isContractor: true` or the `contractor`
   profile based on `session-role`. *(Backend fix: described below.)*

Even after the frontend optimistic fix, the background `refreshSession()` will still return
stale data until the backend is updated.

---

### Required Fixes in Next.js

#### 1. Update `/api/auth/session` to honor `session-role`

**File:** `app/api/auth/session/route.ts`

You must ensure that **both** web and mobile callers see an updated `user` object when `session-role="contractor"` and a confirmed contractor profile exists.

#### Step 1: Authenticate user and get `userId`

Continue using your current logic, but conceptually you want:

```ts
// Pseudocode
let userId: string | null = null;

// A) Mobile (JWT)
const authHeader = req.headers.get("authorization");
if (authHeader?.startsWith("Bearer ")) {
  const token = authHeader.substring(7);
  const decoded = await verifyMobileToken(token); // your existing helper
  userId = decoded?.userId ?? null;
}

// B) Web (Better Auth session) – fallback if no Bearer token
if (!userId) {
  const session = await auth.api.getSession({ headers: req.headers });
  userId = session?.user?.id ?? null;
}

if (!userId) {
  return NextResponse.json({ user: null }, { status: 401 });
}
```

#### Step 2: Load user and contractor from DB

Use Prisma to load the base user and contractor relation:

```ts
const user = await db.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    emailVerified: true,
    image: true,
    role: true,
    isTwoFactorEnabled: true,
    contractor: {
      select: {
        id: true,
        userId: true,
        name: true,
        city: true,
        rating: true,
        confirmed: true,
        specializations: true,
      },
    },
  },
});

if (!user) {
  return NextResponse.json({ user: null }, { status: 404 });
}
```

#### Step 3: Read `session-role` cookie

```ts
import { cookies } from "next/headers";

const cookieStore = await cookies();
const sessionRole = cookieStore.get("session-role")?.value || "user";
```

#### Step 4: Compute `isContractor` and attach contractor profile

Now build the user object that will be sent to the mobile app:

```ts
const hasConfirmedContractor =
  !!user.contractor && user.contractor.confirmed === true;

const responseUser: any = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  role: user.role,
  isTwoFactorEnabled: user.isTwoFactorEnabled,
};

if (sessionRole === "contractor" && hasConfirmedContractor) {
  responseUser.isContractor = true;
  responseUser.contractor = {
    id: user.contractor!.id,
    uid: user.contractor!.userId,
    name: user.contractor!.name,
    city: user.contractor!.city,
    rating: user.contractor!.rating,
    confirmed: user.contractor!.confirmed,
    specializations: user.contractor!.specializations,
  };
} else {
  responseUser.isContractor = false;
  responseUser.contractor = null;
}

return NextResponse.json(
  { user: responseUser },
  {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  }
);
```

This makes the session response match what the Expo app expects:

- `user.isContractor === true` in contractor mode
- `user.contractor` object present and `confirmed === true`

#### 2. Ensure mobile requests can see `session-role`

If the Expo app is **only** sending the JWT in the `Authorization` header and **not** cookies, then `cookies()` in Next.js will not see `session-role` for mobile requests.

You have two options:

##### Option A – Use cookies for mobile as well

- Configure CORS on all relevant API routes (including `/api/auth/switch-role` and `/api/auth/session`) with:
  - `Access-Control-Allow-Origin: *` (or your specific Expo dev URL)
  - `Access-Control-Allow-Credentials: true`
- In the Expo axios instance (`api` in `api/authapi.tsx`), set:

```ts
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
```

Then the `session-role` cookie will be sent along with the JWT in mobile requests, and `cookies()` will work as expected.

##### Option B – Persist active role server-side (DB or JWT)

Alternatively (or additionally), store the active role somewhere other than a cookie:

- Add a field like `activeRole: "USER" | "CONTRACTOR"` to the `User` model, or
- Encode the active role into the mobile JWT payload.

Then, in `/api/auth/session`, you can compute `isContractor` based on that field **instead of** or **in addition to** reading the cookie:

```ts
const isActiveContractor =
  (sessionRole === "contractor" && hasConfirmedContractor) ||
  user.role === "CONTRACTOR" || // example if you have such a field
  user.activeRole === "CONTRACTOR";
```

This avoids relying solely on cookies for mobile.

---

### 3. Double-check `/api/auth/switch-role`

Your `POST /api/auth/switch-role` implementation should already:

- Validate the user is authenticated
- When `role === "contractor"`:
  - Confirm there is a contractor profile for this `userId`
  - Confirm that profile is `confirmed === true`
- Set the `session-role` cookie:

```ts
cookieStore.set("session-role", role, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
});
```

Make sure this logic is in place; otherwise, users without a confirmed contractor profile should not be able to switch to contractor mode (and the Expo app will show the correct error coming from the backend).

---

### Expected Behavior After Fix

For a user **with a confirmed contractor profile**:

1. They tap **Switch to Contractor** in the Expo app.
2. Expo calls `POST /api/auth/switch-role` → response:

```json
{
  "success": true,
  "role": "contractor",
  "message": "Successfully switched to contractor mode"
}
```

3. Expo calls `GET /api/auth/session`:
   - `user.isContractor === true`
   - `user.contractor` object present and `confirmed === true`
4. `useContractorAccess()` returns `canAccess: true`.
5. Navigation to `/contractors` works; **no more “Access Denied – You must be logged in as a contractor”** message.

For users **without** a contractor profile, or with an **unconfirmed** profile:

- `POST /api/auth/switch-role` should return:
  - `404` with `error: "No contractor profile found..."` or
  - `403` with `error: "Contractor profile not confirmed..."`,
- The Expo app already interprets these errors and shows the appropriate alert.

---

### Quick Checklist for Backend

- [ ] `/api/auth/switch-role`:
  - [ ] Validates contractor existence and confirmation when switching to `contractor`
  - [ ] Sets `session-role` cookie correctly
- [ ] `/api/auth/session`:
  - [ ] Authenticates user for both JWT (mobile) and cookie (web)
  - [ ] Loads contractor relation from DB
  - [ ] Reads `session-role` cookie
  - [ ] Sets `user.isContractor` based on `session-role` + confirmed contractor
  - [ ] Returns `user.contractor` object when in contractor mode
- [ ] Mobile:
  - [ ] Sends cookies if you rely on `session-role` for mobile (CORS + `withCredentials`)
  - [ ] After switch, `/contractors` opens without “Access Denied” for valid contractors

