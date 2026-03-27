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
  saveActiveRole,
  getActiveRole,
} from "../utils/secureStore";
import { logger } from "../utils/logger"; // M-5: use dev-gated logger

/**
 * Apply the locally-stored role preference as a UI display hint only.
 *
 * SECURITY NOTE (C-3): This function is a UI optimisation ONLY.
 * It must never be the gate for sensitive API calls or server-side access.
 * The server always re-verifies contractor status from the JWT/database on
 * every protected endpoint. The local value may lag behind the server.
 *
 * The mobile app uses JWT Bearer tokens and cannot forward cookies, so
 * /api/auth/session may return a stale isContractor value after a role switch.
 * The local activeRole in SecureStore is used only to keep the UI consistent.
 */
async function applyDisplayRoleHint(user: User): Promise<User> {
  const activeRole = await getActiveRole();
  if (activeRole === null) {
    // No explicit preference stored – trust the backend value.
    return user;
  }
  // _displayIsContractor is a UI hint; it is NOT sent to the server.
  // The server always checks the JWT claim and the contractor DB record.
  return { ...user, isContractor: activeRole === "contractor" };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (userData: User) => Promise<void>;
  /**
   * Signs the user out locally and attempts server-side session invalidation.
   * Returns true if the server confirmed the logout; false if the server call
   * failed (e.g. network error). Local state is always cleared regardless.
   * M-5: callers can surface a warning to the user when false is returned.
   */
  signOut: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
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
        const serverUser = await authService.getSession();
        if (serverUser) {
          // Apply the locally-stored role preference so a stale backend
          // response never overwrites the user's explicit role choice.
          const currentUser = await applyDisplayRoleHint(serverUser);
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
          const serverUser = await authService.getSession();
          if (serverUser) {
            const currentUser = await applyDisplayRoleHint(serverUser);
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
   * Sign out user and clear all tokens.
   * M-5: Returns true if server-side invalidation succeeded; false if it failed.
   * Local state is always cleared regardless of server result.
   * The caller may warn the user when false is returned (their session may still
   * be active on the server until the refresh token expires).
   */
  const signOut = async (): Promise<boolean> => {
    let serverLogoutOk = false;
    try {
      // Call backend to invalidate session / revoke refresh token
      await authService.logout();
      serverLogoutOk = true;
    } catch (error) {
      // M-5: Log the failure and surface it to the caller
      logger.error("Server-side logout failed. Local tokens cleared but server session may persist:", error);
      // Note: with 5m access tokens and 7d refresh tokens, the exposure window
      // is bounded, but callers should warn the user if serverLogoutOk is false.
    } finally {
      // Always clear local data regardless of server result
      await deleteTokens();
      setUser(null);
    }
    return serverLogoutOk;
  };

  /**
   * Optimistically update user fields in context and cache.
   * Use this for immediate local state changes (e.g. role switching)
   * without waiting for a server round-trip.
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    // If isContractor is being explicitly changed, persist the role preference
    // so that subsequent session refreshes don't overwrite it with stale
    // backend data (mobile callers cannot forward the session-role cookie).
    if ("isContractor" in updates) {
      const newRole = updates.isContractor ? "contractor" : "user";
      saveActiveRole(newRole).catch((err) =>
        console.error("Failed to save active role:", err)
      );
    }

    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Fire-and-forget cache update
      saveUserData(updated).catch((err) =>
        console.error("Failed to cache updated user:", err)
      );
      return updated;
    });
  }, []);

  /**
   * Refresh session - useful for pulling latest user data
   */
  const refreshSession = async () => {
    try {
      const serverUser = await authService.getSession();
      if (serverUser) {
        // Apply the locally-stored role preference as a UI hint only.
        // The server always re-verifies role on protected endpoints (C-3).
        const currentUser = await applyDisplayRoleHint(serverUser);
        setUser(currentUser);
        await saveUserData(currentUser);
      } else {
        await deleteTokens();
        setUser(null);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      // Don't wipe the user on a transient error – just log it.
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
    updateUser,
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
