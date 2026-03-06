# Better Auth Integration for Expo App

This document explains how Better Auth has been integrated into your Expo React Native app to work with your Next.js backend.

## Overview

Better Auth provides a unified authentication system between your Next.js backend and Expo mobile app. The integration includes:

- **Server-side**: Better Auth with Expo plugin in your Next.js app
- **Client-side**: Better Auth client with Expo plugin in your React Native app
- **Session management**: Secure storage using Expo SecureStore
- **Social authentication**: Google and GitHub OAuth support
- **Deep linking**: Automatic redirection after OAuth flows

## Configuration

### 1. Metro Configuration

Updated `metro.config.js` to enable package exports:

```javascript
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true, // Enable Better Auth package exports
};
```

### 2. App Configuration

Updated `app.json` to use the correct scheme:

```json
{
  "expo": {
    "scheme": "myapp" // Must match trustedOrigins in your Next.js config
  }
}
```

### 3. Better Auth Client

Created `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Your Next.js app URL
  plugins: [
    expoClient({
      scheme: "myapp",
      storagePrefix: "nativebnbsos",
      storage: SecureStore,
    }),
  ],
});
```

## Components Created

### 1. BetterAuthProvider (`lib/better-auth-context.tsx`)

Context provider that makes the authClient available throughout the app.

### 2. SessionProvider (`components/SessionProvider.tsx`)

Provides session state and sign-out functionality using Better Auth's useSession hook.

### 3. BetterAuthLoginForm (`components/BetterAuthLoginForm.tsx`)

Login form component that uses Better Auth for email/password and social authentication.

### 4. BetterAuthRegisterForm (`components/BetterAuthRegisterForm.tsx`)

Registration form component with email/password and social sign-up.

### 5. BetterAuthDemo (`components/BetterAuthDemo.tsx`)

Demo component to test authentication functionality and make authenticated requests.

## Usage Examples

### Basic Authentication

```typescript
import { authClient } from "../lib/auth-client";

// Sign in with email/password
const result = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Sign up with email/password
const result = await authClient.signUp.email({
  name: "John Doe",
  email: "user@example.com",
  password: "password",
});

// Social authentication
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});
```

### Session Management

```typescript
import { useSession } from "../components/SessionProvider";

function MyComponent() {
  const { session, isLoading, signOut } = useSession();

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View>
      {session ? (
        <Text>Welcome, {session.user.name}!</Text>
      ) : (
        <Text>Please log in</Text>
      )}
    </View>
  );
}
```

### Making Authenticated Requests

```typescript
import { authenticatedFetch } from "../utils/authenticatedFetch";

// Make authenticated API calls to your Next.js backend
const response = await authenticatedFetch("http://localhost:3000/api/user/me");
const userData = await response.json();
```

## Testing the Integration

1. **Start your Next.js backend** (make sure it's running on localhost:3000)
2. **Start your Expo app**: `npx expo start`
3. **Navigate to the test page**: `/test-better-auth`
4. **Test authentication flows**:
   - Email/password login
   - Registration
   - Social authentication (Google/GitHub)
   - Authenticated API requests
   - Sign out

## Key Features

### 1. Secure Session Storage

Sessions are stored securely using Expo SecureStore, providing:

- Automatic session persistence across app restarts
- Secure cookie management
- No loading spinners needed on app startup

### 2. Social Authentication

Support for Google and GitHub OAuth:

- Automatic deep linking back to the app
- Secure token exchange
- User profile information retrieval

### 3. Authenticated API Requests

Easy way to make authenticated requests:

```typescript
// Automatically includes session cookies
const cookies = authClient.getCookie();
const response = await fetch(url, {
  headers: { Cookie: cookies },
  credentials: "omit",
});
```

### 4. Error Handling

Comprehensive error handling for:

- Network connectivity issues
- Authentication failures
- Session expiration
- OAuth flow errors

## Environment Variables

Make sure your Next.js backend has the correct environment variables:

```env
BETTER_AUTH_URL=http://localhost:3000
EXPO_SCHEME=myapp
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **Deep linking not working**: Ensure scheme matches between app.json and Next.js trustedOrigins
3. **Social auth redirect issues**: Check that OAuth redirect URLs are configured correctly
4. **Session not persisting**: Verify SecureStore is properly configured

### Debug Mode

Enable debug logging by setting:

```typescript
// In your auth-client.ts
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "myapp",
      storagePrefix: "nativebnbsos",
      storage: SecureStore,
      // Add debug logging
      debug: true,
    }),
  ],
});
```

## Migration from Custom Auth

To migrate from your existing custom authentication:

1. Replace `LoginForm` with `BetterAuthLoginForm`
2. Replace custom API calls with `authenticatedFetch`
3. Update session management to use `useSession` hook
4. Remove custom auth context in favor of Better Auth providers

## Next Steps

1. Test all authentication flows
2. Update your existing components to use Better Auth
3. Implement role-based access control using Better Auth's user fields
4. Add two-factor authentication if needed
5. Set up production environment variables

## Support

For issues or questions:

- Better Auth documentation: https://better-auth.com
- Expo integration docs: https://better-auth.com/docs/integrations/expo
- Check the test page `/test-better-auth` for debugging





