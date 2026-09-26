import { authService, getCurrentUser } from "../api/authapi";
import { User } from "../api/types";
import * as WebBrowser from "expo-web-browser";
import { APP_SCHEME, BASE_URL } from "../constants";
import { authClient } from "./auth-client";
import {
  saveToken as persistToken,
  saveRefreshToken as persistRefreshToken,
} from "../utils/secureStore";

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

// Auth utilities for NextAuth
export class AuthManager {
  // Check if user is authenticated by checking session
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  // Get current user session
  static async getCurrentUser(): Promise<User | null> {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // Check if user is a contractor
  static async isContractor(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      return user?.isContractor ?? false;
    } catch {
      return false;
    }
  }

  // Get user session info
  static async getSessionInfo(): Promise<{
    user: User | null;
    isAuthenticated: boolean;
  }> {
    try {
      const user = await getCurrentUser();
      return {
        user,
        isAuthenticated: user !== null,
      };
    } catch {
      return {
        user: null,
        isAuthenticated: false,
      };
    }
  }

  // OAuth Authentication Methods
  //
  // Uses the Better Auth `@better-auth/expo` client to run the provider consent
  // flow, then exchanges the resulting Better Auth session cookie for the custom
  // mobile JWT pair via `POST /api/mobile/auth/social/token` (same response shape
  // as `/api/mobile/auth/login`). This replaces the removed legacy endpoints
  // `/api/auth/mobile/signin/[provider]` and `/api/auth/token`.
  static async signInWithOAuth(provider: string): Promise<User> {
    try {
      // 1. Run the Better Auth OAuth flow. The expo client opens the provider
      //    consent screen and stores the session cookie in SecureStore.
      const callbackURL = `${APP_SCHEME}://home`;
      const result: any = await authClient.signIn.social({
        provider: provider as any,
        callbackURL,
      });

      if (result?.error) {
        throw new Error(result.error.message || "OAuth sign-in failed");
      }

      // 2. Read the stored Better Auth cookie and exchange it for mobile tokens.
      const cookie =
        typeof (authClient as any).getCookie === "function"
          ? (authClient as any).getCookie()
          : "";

      const response = await fetch(`${BASE_URL}/api/mobile/auth/social/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Platform": "mobile",
          ...(cookie ? { Cookie: cookie } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.token) {
        throw new Error(
          data?.error || "Failed to exchange OAuth session for token"
        );
      }

      // 3. Persist tokens exactly like email/password login.
      await persistToken(data.token);
      if (data.refreshToken) {
        await persistRefreshToken(data.refreshToken);
      }

      return {
        ...data.user,
        isContractor:
          typeof data.user?.isContractor === "boolean"
            ? data.user.isContractor
            : !!data.user?.contractor,
      } as User;
    } catch (error: any) {
      console.error("OAuth error:", error);
      throw new Error(error.message || "OAuth authentication failed");
    }
  }
}

// Legacy functions for backward compatibility
export const getToken = async (): Promise<string | null> => {
  // For NextAuth, tokens are managed via HTTP-only cookies
  // This function maintains backward compatibility
  try {
    const user = await getCurrentUser();
    return user ? "nextauth-session" : null;
  } catch {
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  await AuthManager.logout();
};

export const saveToken = async (token: string): Promise<void> => {
  // NextAuth handles session automatically via cookies
  // This function is kept for compatibility but doesn't need to do anything
  console.log("Token saved (NextAuth handles this automatically)");
};
