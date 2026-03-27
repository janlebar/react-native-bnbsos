import { authService, getCurrentUser } from "../api/authapi";
import { User } from "../api/types";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import { APP_SCHEME, BASE_URL } from "../constants";

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
  static async signInWithOAuth(provider: string): Promise<User> {
    try {
      // Configure the redirect URI for your app
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "nativebnbsos",
        path: "auth",
      });

      console.log("Redirect URI:", redirectUri);

      // Generate state parameter for CSRF protection using a cryptographically
      // secure random source. Math.random() is NOT cryptographically secure
      // and must not be used here (H-3 fix).
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const state = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Build the authorization URL that will redirect to your Next.js backend
      const authUrl = new URL(`${BASE_URL}/api/auth/mobile/signin/${provider}`);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirectUri", redirectUri);
      authUrl.searchParams.set("client_id", provider);
      authUrl.searchParams.set("scope", "openid profile email");

      console.log("Auth URL:", authUrl.toString());

      // Open the OAuth flow in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        redirectUri,
        {
          showInRecents: false,
        }
      );

      console.log("OAuth result:", result);

      if (result.type === "success" && result.url) {
        // Parse the callback URL
        const url = new URL(result.url);
        const success = url.searchParams.get("success");
        const sessionToken = url.searchParams.get("sessionToken");
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");

        if (error) {
          throw new Error(url.searchParams.get("error_description") || error);
        }

        if (success === "true" && sessionToken) {
          // Verify the session with your backend
          const authResponse = await authService.verifyMobileSession(
            sessionToken
          );
          if (authResponse.success) {
            return authResponse.user;
          }
          throw new Error("Session verification failed");
        }

        if (code) {
          // Exchange the authorization code for a token
          const tokenResponse = await this.exchangeCodeForToken(code, provider);
          return tokenResponse.user;
        }

        throw new Error(
          "OAuth flow completed but no session token or code received"
        );
      } else if (result.type === "cancel") {
        throw new Error("OAuth flow was cancelled");
      } else {
        throw new Error("OAuth flow failed");
      }
    } catch (error: any) {
      console.error("OAuth error:", error);
      throw new Error(error.message || "OAuth authentication failed");
    }
  }

  private static async exchangeCodeForToken(
    code: string,
    provider: string
  ): Promise<{ user: User }> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Token exchange failed");
      }

      return { user: data.user };
    } catch (error: any) {
      console.error("Token exchange error:", error);
      throw new Error(error.message || "Failed to exchange code for token");
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
