// utils/authenticatedFetch.ts
// Better Auth JWT Token Authenticated Fetch

import { getToken, saveToken, saveRefreshToken, deleteTokens } from "./secureStore";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Make authenticated fetch requests with automatic token refresh
 */
export async function authenticatedFetch(
  endpoint: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  // Get access token
  const token = await getToken();

  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add authorization header if token exists and not skipping auth
  if (token && !skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Build full URL
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // If 401, try to refresh token
    if (response.status === 401 && !skipAuth) {
      const newToken = await refreshTokenAndRetry();
      if (newToken) {
        // Retry with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        return await fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Authenticated fetch error:", error);
    throw error;
  }
}

/**
 * Axios instance with automatic token refresh
 */
const authenticatedAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Always "mobile" — Expo is a mobile-first app even when running as web.
    // Sending "web" causes the server to issue HttpOnly cookies instead of JWT
    // tokens, which Expo cannot read or send cross-origin.
    "X-Client-Platform": "mobile",
  },
  timeout: 10000,
});

// Request interceptor to attach the Bearer token on every request.
// X-Client-Platform is already set in the default headers above.
authenticatedAxios.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
authenticatedAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshOrLogin =
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshOrLogin
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenAndRetry();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return authenticatedAxios(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to refresh access token
 */
async function refreshTokenAndRetry(): Promise<string | null> {
  try {
    const { getRefreshToken } = await import("./secureStore");
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Call refresh endpoint
    const response = await axios.post(`${BASE_URL}/api/mobile/auth/refresh`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;

    // Save new tokens
    await saveToken(token);
    if (newRefreshToken) {
      await saveRefreshToken(newRefreshToken);
    }

    return token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear tokens on refresh failure
    await deleteTokens();
    return null;
  }
}

/**
 * Authenticated API call helpers
 */
export const api = {
  /**
   * GET request
   */
  get: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return authenticatedAxios.get<T>(endpoint, config);
  },

  /**
   * POST request
   */
  post: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return authenticatedAxios.post<T>(endpoint, data, config);
  },

  /**
   * PUT request
   */
  put: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return authenticatedAxios.put<T>(endpoint, data, config);
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return authenticatedAxios.patch<T>(endpoint, data, config);
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return authenticatedAxios.delete<T>(endpoint, config);
  },
};

/**
 * Common API helpers
 */
export const apiHelpers = {
  /**
   * Get current user session
   */
  getCurrentUser: async () => {
    const response = await api.get("/api/auth/session");
    return response.data.user;
  },

  /**
   * Get contractors by location and profession
   */
  getContractors: async (location: string, profession: string[]) => {
    const professionParam = profession.join(",");
    const response = await api.get(
      `/api/mobile/contractors?location=${encodeURIComponent(location)}&profession=${encodeURIComponent(professionParam)}`
    );
    return response.data;
  },

  /**
   * Get user conversations
   */
  getConversations: async () => {
    const response = await api.get("/api/mobile/chat/conversations");
    return response.data;
  },

  /**
   * Send message
   */
  sendMessage: async (conversationId: string, text: string) => {
    const response = await api.post("/api/mobile/chat/messages", {
      conversationId,
      text,
    });
    return response.data;
  },

  /**
   * Create conversation
   */
  createConversation: async (contractorId: number, subject?: string) => {
    const response = await api.post("/api/mobile/chat/conversations", {
      contractorId,
      subject,
    });
    return response.data;
  },
};

export default authenticatedAxios;
