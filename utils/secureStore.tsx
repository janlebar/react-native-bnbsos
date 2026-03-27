// utils/secureStore.tsx
// Better Auth Token Storage - handles access and refresh tokens

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "better_auth_access_token";
const REFRESH_TOKEN_KEY = "better_auth_refresh_token";
const USER_DATA_KEY = "better_auth_user_data";
// Persists the user's chosen active role so that session refreshes
// (which may return stale isContractor from the backend) don't
// overwrite the role the user explicitly selected.
const ACTIVE_ROLE_KEY = "better_auth_active_role";

// H-1 Security fix: on web, use sessionStorage instead of localStorage.
// sessionStorage is cleared when the tab/window closes, limiting the exposure
// window compared to localStorage which persists indefinitely.
// The ideal long-term fix is HttpOnly session cookies from the Next.js backend
// (see nextjs-integration/secuity/security-nextjs.md H-1 section).
const webStorage =
  typeof sessionStorage !== "undefined" ? sessionStorage : null;

/**
 * Save access token (JWT with 5m expiry)
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Error saving access token:", error);
    throw error;
  }
};

/**
 * Get access token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return webStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
    } else {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

/**
 * Save refresh token (JWT with 7d expiry)
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Error saving refresh token:", error);
    throw error;
  }
};

/**
 * Get refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return webStorage?.getItem(REFRESH_TOKEN_KEY) ?? null;
    } else {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

/**
 * Save user data
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(userData);
    if (Platform.OS === "web") {
      webStorage?.setItem(USER_DATA_KEY, jsonData);
    } else {
      await SecureStore.setItemAsync(USER_DATA_KEY, jsonData);
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
};

/**
 * Get user data
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    let jsonData: string | null;
    if (Platform.OS === "web") {
      jsonData = webStorage?.getItem(USER_DATA_KEY) ?? null;
    } else {
      jsonData = await SecureStore.getItemAsync(USER_DATA_KEY);
    }
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Delete access token
 */
export const deleteToken = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.removeItem(ACCESS_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error deleting access token:", error);
  }
};

/**
 * Delete refresh token
 */
export const deleteRefreshToken = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error deleting refresh token:", error);
  }
};

/**
 * Delete user data
 */
export const deleteUserData = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.removeItem(USER_DATA_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (error) {
    console.error("Error deleting user data:", error);
  }
};

/**
 * Save the user's actively chosen role ('user' | 'contractor').
 * This is a UI display hint only — the server always re-verifies role (C-3).
 */
export const saveActiveRole = async (
  role: "user" | "contractor"
): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.setItem(ACTIVE_ROLE_KEY, role);
    } else {
      await SecureStore.setItemAsync(ACTIVE_ROLE_KEY, role);
    }
  } catch (error) {
    console.error("Error saving active role:", error);
  }
};

/**
 * Get the user's actively chosen role.
 * Returns null if no role has been explicitly chosen (fall back to backend).
 */
export const getActiveRole = async (): Promise<"user" | "contractor" | null> => {
  try {
    let value: string | null;
    if (Platform.OS === "web") {
      value = webStorage?.getItem(ACTIVE_ROLE_KEY) ?? null;
    } else {
      value = await SecureStore.getItemAsync(ACTIVE_ROLE_KEY);
    }
    if (value === "user" || value === "contractor") return value;
    return null;
  } catch (error) {
    console.error("Error getting active role:", error);
    return null;
  }
};

/**
 * Delete the active role preference (on logout).
 */
export const deleteActiveRole = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      webStorage?.removeItem(ACTIVE_ROLE_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_ROLE_KEY);
    }
  } catch (error) {
    console.error("Error deleting active role:", error);
  }
};

/**
 * Delete all tokens and user data (logout)
 */
export const deleteTokens = async (): Promise<void> => {
  await Promise.all([
    deleteToken(),
    deleteRefreshToken(),
    deleteUserData(),
    deleteActiveRole(),
  ]);
};
