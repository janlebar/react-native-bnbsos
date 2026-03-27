// api/authapi.tsx
// Better Auth Mobile Integration

import axios, { AxiosResponse, AxiosError } from "axios";
import { Platform } from "react-native";
import {
  UserCredentials,
  LoginResponse,
  RegisterFormValues,
  User,
  LoginAs,
} from "./types";
import { saveToken, saveRefreshToken, getToken, getRefreshToken, deleteTokens } from "../utils/secureStore";
import { logger } from "../utils/logger"; // H-4: dev-gated logger

const API_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";

// Show the actual URL in dev so we can confirm which server is being targeted.
// Tokens/emails are still never logged — only the base URL.
logger.debug("🔍 API_URL:", API_URL);

// Create axios instance with default config for Better Auth.
// X-Client-Platform is set as a DEFAULT header so it is present on every
// request — including the login call — without relying on the async interceptor.
// The server reads this header to decide whether to return tokens in the
// response body (mobile → SecureStore) or set HttpOnly cookies (web).
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // Always "mobile" — Expo is a mobile-first app even when running as web.
    // Sending "web" would cause the server to issue HttpOnly cookies instead of
    // JWT tokens in the response body. Expo cannot read HttpOnly cookies and
    // cannot send them on cross-origin requests, breaking all authenticated calls.
    "X-Client-Platform": "mobile",
  },
  timeout: 10000, // 10-second timeout — surfaces "server not running" quickly
});

// Add request interceptor to attach the Bearer token on authenticated requests.
// X-Client-Platform is already in the default headers above; the interceptor
// only needs to attach the Authorization header.
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Only attempt token refresh when:
    //  1. Server returned 401 (unauthorized)
    //  2. We haven't already retried this exact request
    //  3. The failing request was NOT itself a refresh or login call
    //     (prevents infinite retry loops if refresh/login returns 401)
    const isRefreshOrLogin =
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshOrLogin
    ) {
      originalRequest._retry = true;

      // Detect refresh token reuse — server revokes the entire token family when
      // a previously-used refresh token is replayed (indicates possible theft).
      // Force a full logout rather than silently retrying.
      const errorBody = error.response?.data as any;
      if (errorBody?.error?.includes("already used")) {
        logger.warn("⚠️ Refresh token reuse detected — all sessions revoked. Forcing logout.");
        await deleteTokens();
        const revokedError: Error & { code?: string } = new Error(
          "Your session has been revoked due to suspicious activity. Please log in again."
        );
        revokedError.code = "SESSION_REVOKED";
        return Promise.reject(revokedError);
      }

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Use the api instance so X-Client-Platform is included automatically
        const { data } = await api.post(
          "/api/mobile/auth/refresh",
          { refreshToken }
        );

        // CRITICAL: save the new refresh token immediately — the old one is now
        // invalid (single-use rotation). The server will reject the old token
        // if it is presented again and will revoke the entire session family.
        await saveToken(data.token);
        if (data.refreshToken) {
          await saveRefreshToken(data.refreshToken);
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await deleteTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Better Auth Service Implementation
class AuthService {
  /**
   * Login with email and password using Better Auth mobile endpoint
   * Handles Better Auth's proxied response format
   */
  async login(
    credentials: UserCredentials
  ): Promise<AuthResponse & { loginAs: LoginAs }> {
    try {
      // H-4: Never log email, password, tokens, or full response bodies.
      logger.debug("🔐 Attempting login — loginAs:", credentials.loginAs || "user");
      
      // Use api.post() (not raw axios) so X-Client-Platform and timeout are
      // applied from the instance defaults — critical for the server to return
      // tokens in the body rather than HttpOnly cookies.
      const response = await api.post(
        "/api/mobile/auth/login",
        {
          email: credentials.email,
          password: credentials.password,
          // New mobile contract: tell backend whether we're logging in as user or contractor
          // See `next-auth/Expo_integration/login/contractor_user_login.md`
          loginAs: credentials.loginAs,
        }
      );

      logger.debug("✅ Login response status:", response.status);

      // Better Auth response format (proxied from backend):
      // { user, session, token?, refreshToken? }
      // Tokens might be in session.token or as separate fields
      const data = response.data;
      
      if (!data.user) {
        logger.error("❌ No user data in login response");
        throw new Error("Invalid response from server: no user data");
      }

      // Extract tokens - Better Auth JWT plugin may return tokens in different formats
      let token: string | undefined;
      let refreshToken: string | undefined;

      // Check for tokens in response (Better Auth JWT plugin format)
      if (data.token) {
        token = data.token;
        logger.debug("🔑 Access token present in response");
      } else if (data.session?.token) {
        token = data.session.token;
        logger.debug("🔑 Access token present in session");
      }

      if (data.refreshToken) {
        refreshToken = data.refreshToken;
        logger.debug("🔄 Refresh token present in response");
      } else if (data.session?.refreshToken) {
        refreshToken = data.session.refreshToken;
        logger.debug("🔄 Refresh token present in session");
      }

      // If no token found, Better Auth might be using session cookies
      // In that case, we need to use the session for subsequent requests
      if (!token) {
        logger.warn("⚠️ No token found in Better Auth response. Session-based auth may be used.");
        // For mobile, we still need a token. This might require additional setup.
        throw new Error("Token not found in response. Check Better Auth JWT plugin configuration.");
      }

      // Save tokens to secure storage
      await saveToken(token);
      if (refreshToken) {
        await saveRefreshToken(refreshToken);
      }

      logger.debug("✅ Login successful — user authenticated");

      const effectiveLoginAs: LoginAs =
        (data.loginAs as LoginAs | undefined) || "user";

      return {
        user: {
          ...data.user,
          // Prefer backend flags over requested mode for truth
          isContractor:
            typeof data.user.isContractor === "boolean"
              ? data.user.isContractor
              : !!data.user.contractor,
        },
        token,
        refreshToken: refreshToken || "",
        loginAs: effectiveLoginAs,
      };
    } catch (error: any) {
      // H-4: Do not log the full error response body — it may contain tokens.
      if (error.response) {
        logger.error("❌ Login failed — HTTP", error.response.status);
      } else if (error.request) {
        logger.error("❌ Login failed — no response received. Is the Next.js server running?");
      } else {
        logger.error("❌ Login error:", error.message);
      }

      // Handle 429 Too Many Requests — server-side rate limiting
      if (error.response?.status === 429) {
        const retryAfter: number = error.response.data?.retryAfter ?? 60;
        const rateLimitError: Error & { code?: string } = new Error(
          `Too many login attempts. Please wait ${retryAfter} seconds before trying again.`
        );
        rateLimitError.code = "RATE_LIMITED";
        throw rateLimitError;
      }

      const responseData: any = error.response?.data;
      const backendMessage =
        responseData?.error ||
        (typeof responseData === "string" ? responseData : undefined);

      const finalError: Error & { code?: string } = new Error(
        backendMessage || error.message || "Login failed"
      );

      if (responseData?.code && typeof responseData.code === "string") {
        finalError.code = responseData.code;
      }

      throw finalError;
    }
  }

  /**
   * Register new user using Better Auth mobile endpoint
   * Handles Better Auth's proxied response format
   */
  async register(
    data: RegisterFormValues & { isContractor: boolean }
  ): Promise<AuthResponse> {
    try {
      const response = await api.post(
        "/api/mobile/auth/register",
        {
          name: data.name,
          email: data.email,
          password: data.password,
        }
      );

      // Better Auth response format (proxied from backend):
      // { user, session, token?, refreshToken? }
      const responseData = response.data;
      
      if (!responseData.user) {
        throw new Error("Invalid response from server: no user data");
      }

      // Extract tokens - Better Auth JWT plugin may return tokens in different formats
      let token: string | undefined;
      let refreshToken: string | undefined;

      // Check for tokens in response
      if (responseData.token) {
        token = responseData.token;
      } else if (responseData.session?.token) {
        token = responseData.session.token;
      }

      if (responseData.refreshToken) {
        refreshToken = responseData.refreshToken;
      } else if (responseData.session?.refreshToken) {
        refreshToken = responseData.session.refreshToken;
      }

      if (!token) {
        console.warn("No token found in Better Auth response. Session-based auth may be used.");
        throw new Error("Token not found in response. Check Better Auth JWT plugin configuration.");
      }

      // Save tokens
      await saveToken(token);
      if (refreshToken) {
        await saveRefreshToken(refreshToken);
      }

      return {
        user: {
          ...responseData.user,
          isContractor: data.isContractor,
        },
        token,
        refreshToken: refreshToken || "",
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Registration failed");
    }
  }

  /**
   * Logout and clear tokens.
   * Calls /api/mobile/auth/logout which revokes the stored refresh token in
   * the database (server-side invalidation). The X-Client-Platform header is
   * required so the server also clears the HttpOnly cookie for web clients.
   * Local tokens are always cleared in the finally block regardless of server result.
   */
  async logout(): Promise<void> {
    try {
      // api.post() automatically attaches the Bearer token (via request interceptor)
      // and X-Client-Platform (via default headers). The server revokes the
      // stored refresh token so it cannot be replayed after logout.
      await api.post("/api/mobile/auth/logout", {});
    } catch (error: any) {
      logger.error("Logout error:", error.message);
    } finally {
      // Always clear local tokens regardless of server result
      await deleteTokens();
    }
  }

  /**
   * Get current session using Better Auth
   */
  async getSession(): Promise<User | null> {
    try {
      const token = await getToken();
      if (!token) {
        return null;
      }

      const response = await api.get("/api/auth/session");
      return response.data.user || null;
    } catch (error: any) {
      console.error("Session fetch error:", error);
      return null;
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post("/api/mobile/auth/reset-password", {
        email,
        redirectTo: "/reset-password", // Mobile app route
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Complete password reset with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.patch("/api/mobile/auth/reset-password", {
        token,
        newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to reset password");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Use api.post() so X-Client-Platform is included — ensures tokens are
      // returned in the body, not as HttpOnly cookies
      const response = await api.post(
        "/api/mobile/auth/refresh",
        { refreshToken }
      );

      const { token, refreshToken: newRefreshToken } = response.data;

      await saveToken(token);
      if (newRefreshToken) {
        await saveRefreshToken(newRefreshToken);
      }

      return token;
    } catch (error: any) {
      await deleteTokens();
      throw new Error("Token refresh failed");
    }
  }
}

const authService = new AuthService();

// Export simplified API functions
export const loginApi = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  try {
    const response = await authService.login(credentials);
    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user: response.user,
      twoFactorRequired: false, // Better Auth 2FA is handled in response
      isContractor: response.user.isContractor,
      loginAs: response.loginAs,
    };
  } catch (error: any) {
    throw error;
  }
};

export const registerApi = async (
  data: RegisterFormValues & { isContractor: boolean }
): Promise<AuthResponse> => {
  try {
    return await authService.register(data);
  } catch (error: any) {
    throw error;
  }
};

export const resetPasswordRequestApi = async (email: string): Promise<void> => {
  try {
    await authService.requestPasswordReset(email);
  } catch (error: any) {
    throw error;
  }
};

export const resetPasswordApi = async (
  token: string,
  newPassword: string
): Promise<void> => {
  try {
    await authService.resetPassword(token, newPassword);
  } catch (error: any) {
    throw error;
  }
};

// Contractor interfaces and API
export interface Contractor {
  id: number;
  uid: string;
  name: string;
  rating: number;
  specializations: string[];
  description?: string | null;
  certifications: string[];
  availability: string;
  yearsOfExperience?: number | null;
  address: string;
  city: string;
  contractorLatitude: number;
  contractorLongitude: number;
  datePosted: string;
  confirmed: boolean;
  imageId?: string | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  premiumPlacement?: boolean;
  user?: {
    email?: string | null;
  };
  phone?: string;
}

/**
 * Get contractors by location and profession
 * Requires authentication - phone/email hidden for unauthenticated users
 */
export const getContractorsByLocationAndProfession = async (
  contractorLocation: string,
  profession: string[]
): Promise<Contractor[]> => {
  try {
    // Require at least one profession key; allow empty location so the
    // backend can do a profession-only search (used by the home carousel).
    if (!profession.length) {
      return [];
    }

    const professionParam = profession.join(",");
    const response = await api.get(
      `/api/mobile/contractors?location=${encodeURIComponent(
        contractorLocation
      )}&profession=${encodeURIComponent(professionParam)}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching contractors:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to fetch contractors");
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return await authService.getSession();
  } catch (error: any) {
    return null;
  }
};

/**
 * Switch user role between 'user' and 'contractor'
 */
export interface SwitchRoleResponse {
  success: boolean;
  role?: 'user' | 'contractor';
  message?: string;
  error?: string;
}

export async function switchRoleApi(
  role: 'user' | 'contractor'
): Promise<SwitchRoleResponse> {
  try {
    const response = await api.post('/api/auth/switch-role', { role });
    return response.data;
  } catch (error: any) {
    console.error('Role switch error:', error);
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      'Failed to switch role';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Export the auth service and api instance
export { authService, api };
