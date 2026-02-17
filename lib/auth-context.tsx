// lib/auth-context.tsx
// Better Auth Context with JWT Token Management

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User } from "../api/types";
import { authService } from "../api/authapi";
import {
  getToken,
  getUserData,
  saveUserData,
  deleteTokens,
} from "../utils/secureStore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated and load user data
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // First check for stored tokens
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }

      // Try to get cached user data first (faster)
      const cachedUser = await getUserData();
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Then verify with server
      try {
        const currentUser = await authService.getSession();
        if (currentUser) {
          setUser(currentUser);
          // Update cached user data
          await saveUserData(currentUser);
        } else {
          // Token is invalid, clear everything
          await deleteTokens();
          setUser(null);
        }
      } catch (error) {
        // If session check fails, try to refresh token
        try {
          await authService.refreshAccessToken();
          const currentUser = await authService.getSession();
          if (currentUser) {
            setUser(currentUser);
            await saveUserData(currentUser);
          } else {
            await deleteTokens();
            setUser(null);
          }
        } catch (refreshError) {
          // Refresh failed, user needs to login again
          await deleteTokens();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await deleteTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign in user and save data
   */
  const signIn = async (userData: User) => {
    try {
      setUser(userData);
      await saveUserData(userData);
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  /**
   * Sign out user and clear all tokens
   */
  const signOut = async () => {
    try {
      // Call backend to invalidate session
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // Always clear local data
      await deleteTokens();
      setUser(null);
    }
  };

  /**
   * Refresh session - useful for pulling latest user data
   */
  const refreshSession = async () => {
    try {
      const currentUser = await authService.getSession();
      if (currentUser) {
        setUser(currentUser);
        await saveUserData(currentUser);
      } else {
        await deleteTokens();
        setUser(null);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      await deleteTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    checkAuth,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
