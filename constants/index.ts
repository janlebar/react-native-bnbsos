/**
 * Application Constants
 * Better Auth Integration
 *
 * This file centralizes all constants used across the application.
 * Import from this file instead of defining constants in individual files.
 */

// Environment Constants
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";
export const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || "myapp";

// Better Auth Token Constants
export const ACCESS_TOKEN_EXPIRY = "20s"; // 20 seconds (as per lib/jwt.ts in Next.js)
export const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days (as per lib/jwt.ts in Next.js)
export const ACCESS_TOKEN_MAX_AGE = 20; // 20 seconds
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Token Refresh Settings
export const REFRESH_BEFORE_EXPIRY_SEC = 15; // Refresh token 15 seconds before expiry (since access token is 20s)

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
