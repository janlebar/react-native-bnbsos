# Quick Start Guide - Better Auth Mobile Integration

## Prerequisites

- Next.js backend running with Better Auth configured
- Node.js and npm/yarn installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

---

## Step 1: Install Dependencies

```bash
cd /Users/test1/Documents/bnbsos/react-native/nativebnbsos
npm install
```

---

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SCHEME=myapp
```

For iOS Simulator with localhost:
```env
EXPO_PUBLIC_BASE_URL=http://localhost:3000
```

For Android Emulator with localhost:
```env
EXPO_PUBLIC_BASE_URL=http://10.0.2.2:3000
```

For physical device:
```env
EXPO_PUBLIC_BASE_URL=http://YOUR_COMPUTER_IP:3000
# Example: http://192.168.1.100:3000
```

---

## Step 3: Verify Next.js Backend is Running

Make sure your Next.js backend is running with Better Auth:

```bash
# In your Next.js project directory
npm run dev
```

Verify it's accessible at `http://localhost:3000`

---

## Step 4: Implement Critical Next.js Endpoint

⚠️ **REQUIRED BEFORE RUNNING APP**

The app **WILL NOT WORK** without the token refresh endpoint. Implement this first:

### Create `app/api/mobile/auth/refresh/route.ts` in Next.js

```typescript
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

    const payload = verifyRefreshToken(refreshToken);

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { contractor: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

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

    response.headers.set("Access-Control-Allow-Origin", "*");
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

## Step 5: Start the React Native App

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

---

## Step 6: Test the App

### 6.1 Test Login

1. Click "Login" or navigate to login screen
2. Enter credentials:
   - Email: (your test user email)
   - Password: (your test user password)
3. Click "Login"
4. Should redirect to home screen if successful

### 6.2 Test Token Refresh

1. Stay logged in
2. Wait 20+ seconds
3. Navigate to any screen that makes API calls
4. Should work seamlessly (token refresh happens automatically)
5. Check console logs for `Token refresh` messages

### 6.3 Test Logout

1. Click logout button
2. Should redirect to login screen
3. Try to access protected routes - should be blocked

---

## Troubleshooting

### "Network request failed"

**Cause:** App can't reach Next.js backend

**Solutions:**
1. Make sure Next.js is running on port 3000
2. Check `EXPO_PUBLIC_BASE_URL` in `.env`
3. For physical device, use your computer's IP address
4. Disable firewall temporarily to test
5. For Android Emulator, use `http://10.0.2.2:3000`

### "Invalid or expired refresh token"

**Cause:** Token refresh endpoint not implemented or not working

**Solutions:**
1. Implement `/api/mobile/auth/refresh/route.ts` in Next.js (see Step 4)
2. Make sure `lib/jwt.ts` has `verifyRefreshToken()` function
3. Check console logs for detailed error messages

### "Authentication required"

**Cause:** No access token or token expired

**Solutions:**
1. Login again
2. Check if token refresh endpoint is working
3. Clear app data and re-login
4. Check secure storage is working

### CORS Errors

**Cause:** CORS headers not configured in Next.js

**Solutions:**
1. Add CORS headers to all `/api/mobile/*` endpoints
2. See `NEXTJS_MISSING_ENDPOINTS.md` for CORS configuration
3. Restart Next.js server after adding CORS headers

### App crashes on login

**Cause:** Missing dependencies or configuration issues

**Solutions:**
1. Run `npm install` again
2. Clear cache: `expo start --clear`
3. Check console logs for error details
4. Make sure all dependencies are installed

---

## Development Workflow

### 1. Running with Hot Reload

```bash
# Terminal 1: Next.js Backend
cd /path/to/nextjs-app
npm run dev

# Terminal 2: React Native App
cd /Users/test1/Documents/bnbsos/react-native/nativebnbsos
npm start
```

### 2. Viewing Logs

```bash
# React Native logs
npm start
# Then press 'j' to open debugger

# Next.js logs
# Visible in the terminal where you ran 'npm run dev'
```

### 3. Debugging

#### React Native
- Open debugger: Press `j` in Expo CLI
- Use React Native Debugger app
- Check console logs in terminal

#### Backend
- Check terminal logs where Next.js is running
- Add `console.log()` in API routes
- Use Next.js built-in error reporting

---

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Logout
- [ ] Stay logged in and wait 20+ seconds (token should refresh)
- [ ] Navigate between screens while logged in
- [ ] Restart app while logged in (should restore session)
- [ ] Password reset request
- [ ] Register new account

---

## What to Implement Next in Next.js

See `NEXTJS_MISSING_ENDPOINTS.md` for complete implementation details.

### Priority 1 (Critical)
1. ✅ `/api/mobile/auth/refresh` - Token refresh
2. `/api/mobile/contractors` - List contractors
3. `/api/mobile/chat/conversations` - Get conversations
4. `/api/mobile/chat/messages` - Send messages

### Priority 2 (Important)
5. `/api/mobile/chat/contacts` - List contacts
6. `/api/mobile/chat/conversations/[id]` - Get conversation
7. `/api/mobile/contractors/[id]` - Get contractor

---

## Production Deployment

### React Native App

1. Update `.env` with production URL:
```env
EXPO_PUBLIC_BASE_URL=https://your-production-domain.com
```

2. Build for production:
```bash
# iOS
expo build:ios

# Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform all
```

### Next.js Backend

1. Make sure all mobile endpoints are implemented
2. Update environment variables for production
3. Configure CORS for your production domain
4. Deploy to Vercel/your hosting platform

---

## Additional Resources

- **Better Auth Docs:** https://better-auth.com
- **Expo Docs:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org

- **Project Documentation:**
  - `BETTER_AUTH_INTEGRATION_SUMMARY.md` - Complete integration overview
  - `NEXTJS_MISSING_ENDPOINTS.md` - API endpoints to implement
  - `mobile-better-auth.md` - Reference from Next.js project

---

## Getting Help

If you encounter issues:

1. Check console logs (both React Native and Next.js)
2. Review error messages carefully
3. Check `NEXTJS_MISSING_ENDPOINTS.md` for API implementation
4. Review `BETTER_AUTH_INTEGRATION_SUMMARY.md` for architecture
5. Make sure all dependencies are installed
6. Clear cache and restart: `expo start --clear`

---

**Ready to start?** Run `npm start` and press `i` for iOS or `a` for Android!
