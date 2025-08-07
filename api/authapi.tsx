// src/api/auth.ts

import axios, { AxiosResponse } from "axios";
import { UserCredentials, LoginResponse } from "./types";
import { RegisterFormValues } from "./types";
import { User } from "./types";

const API_URL = "http://localhost:3000/api"; // Replace with your actual Next.js app URL

// Create axios instance with default config for NextAuth
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for NextAuth session cookies
});

interface LoginCredentials {
  email: string;
  password: string;
  isContractor: boolean;
}

interface AuthResponse {
  user: User;
  success: boolean;
}

interface UserInfo {
  user?: User;
  expires?: string;
}

// NextAuth implementation
class AuthService {
  private async getCsrfToken(): Promise<string> {
    const { data: csrfRequest } = await api.get("/auth/csrf", {
      withCredentials: true,
    });
    return csrfRequest.csrfToken;
  }

  private async performLogin(
    credentials: LoginCredentials,
    csrfToken: string
  ): Promise<AxiosResponse> {
    const body = this.createLoginBody(credentials, csrfToken);
    return api.post("/auth/callback/credentials", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      withCredentials: true,
    });
  }

  private createLoginBody(
    credentials: LoginCredentials,
    csrfToken: string
  ): string {
    return Object.entries({
      csrfToken,
      email: encodeURIComponent(credentials.email),
      password: encodeURIComponent(credentials.password),
      isContractor: credentials.isContractor,
      callbackUrl: encodeURIComponent("/"),
      redirect: false,
      json: true,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  private async getUserInfo(): Promise<UserInfo> {
    const { data: userInfo } = await api.get<UserInfo>("/auth/session");
    return userInfo;
  }

  private handleSuccessfulLogin(
    userInfo: UserInfo,
    email: string
  ): AuthResponse {
    if (userInfo.user) {
      return {
        user: userInfo.user,
        success: true,
      };
    }
    throw new Error("Login failed - no user info returned");
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const csrfToken = await this.getCsrfToken();
      const loginResponse = await this.performLogin(credentials, csrfToken);

      if (loginResponse.status === 200) {
        const userInfo = await this.getUserInfo();
        return this.handleSuccessfulLogin(userInfo, credentials.email);
      }

      throw new Error("Login failed");
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Login failed");
    }
  }

  async logout(): Promise<void> {
    try {
      const csrfToken = await this.getCsrfToken();
      await api.post(
        "/auth/signout",
        {
          csrfToken,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    } catch (error: any) {
      console.error("Logout error:", error);
      throw new Error("Logout failed");
    }
  }

  async getSession(): Promise<UserInfo> {
    try {
      return await this.getUserInfo();
    } catch (error: any) {
      throw new Error("Failed to get session");
    }
  }

  // OAuth methods for mobile authentication
  async initiateOAuthFlow(
    provider: string,
    redirectUri: string
  ): Promise<string> {
    try {
      // Generate state for security
      const state = Math.random().toString(36).substring(2, 15);

      // Create the OAuth URL that will redirect to your backend
      const authUrl = new URL(`${API_URL}/auth/mobile/signin/${provider}`);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirectUri", redirectUri);
      authUrl.searchParams.set("client_id", provider);
      authUrl.searchParams.set("scope", "openid profile email");

      return authUrl.toString();
    } catch (error: any) {
      throw new Error(`Failed to initiate OAuth flow: ${error.message}`);
    }
  }

  async verifyMobileSession(sessionToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/mobile/verify", {
        sessionToken,
      });

      if (response.data.success) {
        return {
          user: response.data.user,
          success: true,
        };
      }

      throw new Error("Session verification failed");
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Session verification failed");
    }
  }

  async handleOAuthCallback(
    provider: string,
    callbackUrl: string
  ): Promise<AuthResponse> {
    try {
      // Extract parameters from callback URL
      const url = new URL(callbackUrl);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code) {
        throw new Error("No authorization code received");
      }

      // Exchange code for session via your backend
      const response = await api.get(`/auth/callback/${provider}`, {
        params: { code, state },
        withCredentials: true,
      });

      if (response.status === 200) {
        const userInfo = await this.getUserInfo();
        return this.handleSuccessfulLogin(userInfo, "");
      }

      throw new Error("OAuth callback failed");
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "OAuth login failed");
    }
  }
}

const authService = new AuthService();

// Updated loginApi to use NextAuth
export const loginApi = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  try {
    const authResponse = await authService.login({
      email: credentials.email,
      password: credentials.password,
      isContractor: credentials.isContractor,
    });

    // NextAuth doesn't use tokens in the same way, but we'll simulate the response
    // for compatibility with existing code
    return {
      token: "nextauth-session", // Placeholder - NextAuth uses HTTP-only cookies
      twoFactorRequired: false, // NextAuth 2FA would be handled differently
      isContractor: authResponse.user.isContractor,
    };
  } catch (error: any) {
    throw error;
  }
};

// Register API - may need to be updated based on your NextAuth setup
export const registerApi = async (
  data: RegisterFormValues & { isContractor: boolean }
): Promise<any> => {
  try {
    const response = await api.post("/api/auth/register", data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Registration failed");
  }
};

// Password reset API
export const resetApi = async ({ email }: { email: string }) => {
  try {
    const response = await api.post("/api/auth/reset", { email });
    return response.data.message;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Password reset failed");
  }
};

// Contractor interfaces and API
export interface Contractor {
  id: number;
  name: string;
  rating?: number;
  specialization?: string;
  description?: string;
  certifications: string[];
  availability?: string;
  yearsOfExperience?: number;
  address?: string;
  city: string;
  contractorLatitude?: number;
  contractorLongitude?: number;
  datePosted?: string;
  confirmed?: boolean;
  imageId?: string;
  user?: {
    email?: string;
  };
  phone?: string;
}

export const getContractorsByLocationAndProfession = async (
  contractorLocation: string,
  profession: string[]
): Promise<Contractor[]> => {
  try {
    if (!contractorLocation || !profession.length) {
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

// Current user API using NextAuth session
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userInfo = await authService.getSession();
    return userInfo.user || null;
  } catch (error: any) {
    return null; // User not authenticated
  }
};

// Export the auth service for direct use if needed
export { authService };
