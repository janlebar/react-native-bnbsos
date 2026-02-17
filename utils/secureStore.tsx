// utils/secureStore.tsx
// Better Auth Token Storage - handles access and refresh tokens

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "better_auth_access_token";
const REFRESH_TOKEN_KEY = "better_auth_refresh_token";
const USER_DATA_KEY = "better_auth_user_data";

/**
 * Save access token (JWT with 20s expiry)
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
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
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

/**
 * Save refresh token (JWT with 30d expiry)
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
      return localStorage.getItem(REFRESH_TOKEN_KEY);
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
      localStorage.setItem(USER_DATA_KEY, jsonData);
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
      jsonData = localStorage.getItem(USER_DATA_KEY);
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
      localStorage.removeItem(ACCESS_TOKEN_KEY);
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
      localStorage.removeItem(REFRESH_TOKEN_KEY);
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
      localStorage.removeItem(USER_DATA_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    }
  } catch (error) {
    console.error("Error deleting user data:", error);
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
  ]);
};
