import { authService, getCurrentUser } from "../api/authapi";
import { User } from "../api/types";

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
}

// Legacy functions for backward compatibility
export const getToken = async (): Promise<string | null> => {
  // NextAuth uses HTTP-only cookies, so we return a placeholder
  const isAuth = await AuthManager.isAuthenticated();
  return isAuth ? "nextauth-session" : null;
};

export const removeToken = async (): Promise<void> => {
  await AuthManager.logout();
};

export const saveToken = async (token: string): Promise<void> => {
  // NextAuth handles session automatically via cookies
  // This function is kept for compatibility but doesn't need to do anything
  console.log("Token saved (NextAuth handles this automatically)");
};
