// api/authapi.tsx
// Better Auth Mobile Integration

import axios, { AxiosResponse, AxiosError } from "axios";
import { UserCredentials, LoginResponse, RegisterFormValues, User } from "./types";
import { saveToken, saveRefreshToken, getToken, getRefreshToken, deleteTokens } from "../utils/secureStore";

const API_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3000";

// Debug: Log env variable values
console.log("🔍 Environment check:");
console.log("  EXPO_PUBLIC_BASE_URL:", process.env.EXPO_PUBLIC_BASE_URL);
console.log("  API_URL resolved to:", API_URL);

// Create axios instance with default config for Better Auth
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include access token
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

    // If error is 401 and we haven't retried yet, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const { data } = await axios.post(
          `${API_URL}/api/mobile/auth/refresh`,
          { refreshToken }
        );

        // Save new tokens
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
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      console.log("🔍 Login method - API_URL at runtime:", API_URL);
      console.log("🔍 Login method - process.env.EXPO_PUBLIC_BASE_URL:", process.env.EXPO_PUBLIC_BASE_URL);
      console.log("🔐 Attempting login to:", `${API_URL}/api/mobile/auth/login`);
      console.log("📧 Email:", credentials.email);
      
      const response = await axios.post(
        `${API_URL}/api/mobile/auth/login`,
        {
          email: credentials.email,
          password: credentials.password,
        }
      );

      console.log("✅ Login response status:", response.status);
      console.log("📦 Response data:", JSON.stringify(response.data, null, 2));

      // Better Auth response format (proxied from backend):
      // { user, session, token?, refreshToken? }
      // Tokens might be in session.token or as separate fields
      const data = response.data;
      
      if (!data.user) {
        console.error("❌ No user data in response");
        throw new Error("Invalid response from server: no user data");
      }

      // Extract tokens - Better Auth JWT plugin may return tokens in different formats
      let token: string | undefined;
      let refreshToken: string | undefined;

      // Check for tokens in response (Better Auth JWT plugin format)
      if (data.token) {
        token = data.token;
        console.log("🔑 Access token found in data.token");
      } else if (data.session?.token) {
        token = data.session.token;
        console.log("🔑 Access token found in data.session.token");
      }

      if (data.refreshToken) {
        refreshToken = data.refreshToken;
        console.log("🔄 Refresh token found in data.refreshToken");
      } else if (data.session?.refreshToken) {
        refreshToken = data.session.refreshToken;
        console.log("🔄 Refresh token found in data.session.refreshToken");
      }

      // If no token found, Better Auth might be using session cookies
      // In that case, we need to use the session for subsequent requests
      if (!token) {
        console.warn("⚠️ No token found in Better Auth response. Session-based auth may be used.");
        // For mobile, we still need a token. This might require additional setup.
        throw new Error("Token not found in response. Check Better Auth JWT plugin configuration.");
      }

      // Save tokens
      console.log("💾 Saving tokens to secure storage...");
      await saveToken(token);
      if (refreshToken) {
        await saveRefreshToken(refreshToken);
      }

      console.log("✅ Login successful!");

      return {
        user: {
          ...data.user,
          isContractor: credentials.isContractor || !!data.user.contractor,
        },
        token,
        refreshToken: refreshToken || "",
      };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      
      if (error.response) {
        console.error("📡 Response status:", error.response.status);
        console.error("📡 Response data:", error.response.data);
        console.error("📡 Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("📡 No response received. Request:", error.request);
        console.error("🌐 Is Next.js server running on", API_URL, "?");
      } else {
        console.error("⚙️ Error setting up request:", error.message);
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Login failed");
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
      const response = await axios.post(
        `${API_URL}/api/mobile/auth/register`,
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
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call Better Auth signout
      const token = await getToken();
      if (token) {
        await axios.post(
          `${API_URL}/api/auth/sign-out`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local tokens
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
      await axios.post(`${API_URL}/api/mobile/auth/reset-password`, {
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
      await axios.patch(`${API_URL}/api/mobile/auth/reset-password`, {
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

      const response = await axios.post(
        `${API_URL}/api/mobile/auth/refresh`,
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

// Export the auth service and api instance
export { authService, api };
