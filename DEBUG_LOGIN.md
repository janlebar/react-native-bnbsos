# 🐛 Login Debugging Guide

## Changes Made

I've added detailed console logging to help debug the login issue:

### 1. ✅ LoginForm.tsx
- Added console logs to track the login flow
- Button now logs when pressed
- Login response is logged with user data
- Navigation is logged

### 2. ✅ authapi.tsx  
- Added detailed logging for the entire login process
- Shows API URL being called
- Shows response status and data
- Shows token extraction process
- Shows network errors clearly

---

## How to Debug

### Step 1: Open Browser Console

Since you're running on web (`http://localhost:8081`):

1. **Open your browser** where the app is running
2. **Open Developer Tools**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
3. **Go to the Console tab**

### Step 2: Try to Log In

1. Enter your email and password
2. Click the Login button
3. **Watch the console** for these messages:

#### ✅ Expected Console Output (If Working):
```
🔘 Login button pressed!
Starting login with email: your@email.com
🔐 Attempting login to: http://localhost:3000/api/mobile/auth/login
📧 Email: your@email.com
✅ Login response status: 200
📦 Response data: { user: {...}, token: "..." }
🔑 Access token found in data.token
🔄 Refresh token found in data.refreshToken
💾 Saving tokens to secure storage...
✅ Login successful!
Login response received: { hasUser: true, hasToken: true, userId: "..." }
User signed in, navigating...
```

#### ❌ What You Might See (Errors):

**Error 1: Button Not Working**
```
(Nothing in console when clicking button)
```
**Fix:** The button might not be visible or clickable. Check if the form is rendering.

**Error 2: Network Error**
```
❌ Login error: AxiosError
📡 No response received
🌐 Is Next.js server running on http://localhost:3000?
```
**Fix:** Your Next.js backend is NOT running! You need to implement the endpoints first.

**Error 3: CORS Error**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/mobile/auth/login' 
from origin 'http://localhost:8081' has been blocked by CORS policy
```
**Fix:** Next.js backend is missing the `/api/mobile/auth/login` endpoint. Implement it from `NEXTJS_COMPLETE_IMPLEMENTATION.md`

**Error 4: 404 Not Found**
```
❌ Login error: Request failed with status code 404
📡 Response status: 404
```
**Fix:** The login endpoint doesn't exist. Implement it from the guide.

**Error 5: Redirect Error**
```
❌ Login error: Request failed with status code 302
📡 Response status: 302
```
**Fix:** Next.js is redirecting to a web login page. The mobile endpoint is missing.

---

## Most Likely Issue

Based on your previous error about CORS and redirects, **your Next.js backend is missing the mobile endpoints**.

### Quick Check

Open your browser and try this URL directly:
```
http://localhost:3000/api/mobile/auth/login
```

**If you see:**
- ❌ **404** or **redirect to /en/auth/login** → Endpoints not implemented
- ✅ **405 Method Not Allowed** → Endpoint exists! (POST is needed, not GET)

---

## Solution: Implement Next.js Endpoints

### 🎯 Follow These Steps:

1. **Open** `NEXTJS_START_HERE.md` in this project
2. **Follow** the guide to `NEXTJS_COMPLETE_IMPLEMENTATION.md`  
3. **Implement** the 3 critical endpoints:
   - `/api/mobile/auth/login` (POST)
   - `/api/mobile/auth/register` (POST)
   - `/api/mobile/auth/refresh` (POST)
4. **Create** `lib/jwt.ts` (JWT utilities)
5. **Add** environment variables to Next.js `.env.local`
6. **Restart** Next.js server

### Quick Implementation (5 minutes):

```bash
# 1. Navigate to your Next.js project
cd /path/to/your/nextjs-project

# 2. Create directories
mkdir -p app/api/mobile/auth/{login,register,refresh}

# 3. Copy the 3 endpoint codes from NEXTJS_COMPLETE_IMPLEMENTATION.md
#    - app/api/mobile/auth/login/route.ts
#    - app/api/mobile/auth/register/route.ts  
#    - app/api/mobile/auth/refresh/route.ts

# 4. Copy lib/jwt.ts from the guide

# 5. Add to .env.local:
echo "JWT_SECRET=your-super-secret-key-at-least-32-chars" >> .env.local
echo "REFRESH_TOKEN_SECRET=your-other-secret-key" >> .env.local

# 6. Install jsonwebtoken
npm install jsonwebtoken @types/jsonwebtoken

# 7. Restart Next.js
npm run dev
```

---

## Testing After Implementation

### 1. Test the Endpoint Directly

```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

**Expected:** JSON response with user and tokens

### 2. Test in Mobile App

1. Reload your Expo app (press `r` in terminal)
2. Try logging in
3. Check console for the detailed logs

---

## Quick Diagnosis Checklist

- [ ] Is Next.js running? (check `http://localhost:3000`)
- [ ] Did you implement `/api/mobile/auth/login`?
- [ ] Does the endpoint have CORS headers?
- [ ] Did you create `lib/jwt.ts`?
- [ ] Did you add JWT_SECRET to .env.local?
- [ ] Did you restart Next.js after changes?
- [ ] Can you see console logs in browser?
- [ ] Is the button actually clickable?

---

## What to Report Back

When you try logging in, copy-paste the console output here. Look for:

1. Does "🔘 Login button pressed!" appear?
2. What does "🔐 Attempting login to:" show?
3. Are there any ❌ errors?
4. What's the response status?

This will help me identify the exact issue!

---

## Alternative: Check if Backend Exists

If you're not sure if your Next.js backend has the endpoints:

```bash
# In your Next.js project directory
ls -la app/api/mobile/auth/login/
```

**If you see:** `No such file or directory` → You need to implement the endpoints!

**If you see:** `route.ts` → Great! Check the file has correct code.

---

**TL;DR:** Open browser console, try to login, and tell me what errors you see! 🔍
