# OAuth Setup Guide for React Native App

This guide explains how to set up OAuth authentication in your React Native app using Auth.js backend.

## 1. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth Client ID and Secret from Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Apple OAuth Client Secret (Generate yours at https://applekeygen.expo.app)
APPLE_CLIENT_SECRET=your_apple_client_secret_here

# Base URL and scheme for the app (change for production)
EXPO_PUBLIC_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SCHEME=nativebnbsos://

# JWT Secret and Refresh Secret to sign and verify tokens
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
```

## 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
5. Choose "Web application" type
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

## 3. Apple Developer Setup (Optional)

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a new identifier for "Sign in with Apple"
3. Configure your service identifier
4. Generate a client secret at [applekeygen.expo.app](https://applekeygen.expo.app)

## 4. What's Implemented

### React Native Side:

- ✅ OAuth button components
- ✅ Deep linking configuration
- ✅ OAuth flow initiation
- ✅ Session management integration
- ✅ Error handling

### Still needed for Next.js backend:

- 🔄 `/api/auth/mobile/signin/[provider]` endpoint
- 🔄 `/api/auth/mobile/callback/[provider]` endpoint
- 🔄 `/api/auth/mobile/verify` endpoint
- 🔄 `/api/auth/token` endpoint
- 🔄 Auth.js provider configuration

## 5. OAuth Flow

1. User clicks OAuth button in React Native app
2. App opens browser with backend OAuth URL
3. User authenticates with provider (Google/Apple)
4. Provider redirects to Next.js backend with auth code
5. Backend exchanges code for tokens and creates session
6. Backend redirects to mobile app with session token
7. Mobile app verifies session with backend

## 6. Testing

1. Make sure your Next.js backend is running on `http://localhost:3000`
2. Start the React Native app: `npx expo start`
3. Try the OAuth login buttons on the login screen
4. Check the console logs for debugging information

## 7. Production Considerations

- Update `EXPO_PUBLIC_BASE_URL` to your production domain
- Update OAuth provider redirect URIs
- Use secure secrets in production
- Test deep linking on physical devices
- Configure proper SSL certificates

## 8. Troubleshooting

- Make sure `.env.local` is in the correct location
- Verify OAuth provider configurations
- Check that redirect URIs match exactly
- Enable debug logs in development
- Test on physical devices for deep linking

## Next Steps

The Next.js backend endpoints need to be implemented to complete the OAuth flow. The React Native side is ready and will work once the backend endpoints are in place.
