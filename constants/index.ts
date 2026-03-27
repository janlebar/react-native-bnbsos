/**
 * Application Constants
 * Better Auth Integration
 *
 * This file centralizes all constants used across the application.
 * Import from this file instead of defining constants in individual files.
 */

// Environment Constants
// H-2 Security fix: fail loudly if EXPO_PUBLIC_BASE_URL is missing or insecure in production.
const _rawBaseUrl = process.env.EXPO_PUBLIC_BASE_URL;

if (!_rawBaseUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "[Security] EXPO_PUBLIC_BASE_URL must be set in production builds. " +
    "Add it to your .env.production file."
  );
}

if (_rawBaseUrl?.startsWith("http://") && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.error(
    "[Security] EXPO_PUBLIC_BASE_URL is using HTTP in production. " +
    "All API traffic including tokens will be sent in plaintext. Use HTTPS."
  );
}

export const BASE_URL = _rawBaseUrl || "http://localhost:3000";
export const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || "myapp";

// Better Auth Token Constants
// L-3 fix: Increased access token from 20s to 5m.
//   - 20s provided no practical security benefit over 5m when refresh tokens are
//     properly rotated and revoked on logout.
//   - 20s caused near-constant refresh overhead (a new access token for every
//     second API call), increasing server load and race condition probability.
//   - 5m is still short enough to limit exposure from a stolen access token.
//   - Update lib/jwt.ts in the Next.js backend to match (see security-nextjs.md).
export const ACCESS_TOKEN_EXPIRY = "5m"; // 5 minutes
export const ACCESS_TOKEN_MAX_AGE = 5 * 60; // 300 seconds

// M-4 fix: Reduced refresh token from 30d to 7d.
//   - A 30-day window gives an attacker too long to silently replay a stolen token.
//   - 7 days balances usability (most active users won't need to re-login) with
//     a shorter stolen-token exposure window.
//   - Enable refresh token rotation on the Next.js backend (see security-nextjs.md).
//   - Update lib/jwt.ts in the Next.js backend to match.
export const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days (reduced from 30d)
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Token Refresh Settings — refresh 60 seconds before expiry to avoid edge cases
export const REFRESH_BEFORE_EXPIRY_SEC = 60; // Refresh 60s before expiry (5m token)

// Better Auth API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/api/mobile/auth/login",
  REGISTER: "/api/mobile/auth/register",
  LOGOUT: "/api/auth/sign-out",
  SESSION: "/api/auth/session",
  REFRESH: "/api/mobile/auth/refresh",
  RESET_PASSWORD_REQUEST: "/api/mobile/auth/reset-password", // POST
  RESET_PASSWORD_COMPLETE: "/api/mobile/auth/reset-password", // PATCH

  // Chat endpoints (to be implemented in Next.js)
  CONVERSATIONS: "/api/mobile/chat/conversations",
  CONVERSATION_BY_ID: (id: string) => `/api/mobile/chat/conversations/${id}`,
  MESSAGES: "/api/mobile/chat/messages",
  SEND_MESSAGE: "/api/mobile/chat/messages",
  
  // Contractor endpoints (to be implemented in Next.js)
  CONTRACTORS: "/api/mobile/contractors",
  CONTRACTOR_BY_ID: (id: number) => `/api/mobile/contractors/${id}`,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "better_auth_access_token",
  REFRESH_TOKEN: "better_auth_refresh_token",
  USER_DATA: "better_auth_user_data",
};

// OAuth Providers (for Better Auth)
export const OAUTH_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    authUrl: `${BASE_URL}/api/auth/sign-in/social`,
  },
  {
    id: "github",
    name: "GitHub",
    authUrl: `${BASE_URL}/api/auth/sign-in/social`,
  },
];

// User Roles
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

// App Configuration
export const APP_CONFIG = {
  name: "BnbSos Native",
  scheme: APP_SCHEME,
  baseUrl: BASE_URL,
};
