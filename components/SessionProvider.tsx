import React, { createContext, useContext, ReactNode } from "react";
import { Platform } from "react-native";
import { authClient } from "../lib/auth-client";

interface SessionContextType {
  session: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that calls authClient.useSession() only on native (iOS/Android).
 *
 * On web, authClient.useSession() fires GET /api/auth/get-session automatically
 * on every mount, which generates a CORS error because the Expo dev server
 * (port 8081) and the Next.js API server (port 3000) are different origins.
 *
 * This app authenticates with Bearer JWT tokens stored in SecureStore /
 * sessionStorage — it does NOT rely on better-auth cookie sessions. The
 * authClient session is therefore unused on web and safe to skip entirely.
 */
function NativeSessionProvider({ children }: SessionProviderProps) {
  const { data: session, isPending: isLoading } = authClient.useSession();

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <SessionContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

/** On web: provide a null session — Bearer tokens handle auth via authapi.tsx. */
function WebSessionProvider({ children }: SessionProviderProps) {
  const signOut = async () => {
    // No-op: web signout is handled by the AuthContext / authapi.tsx logout
  };

  return (
    <SessionContext.Provider value={{ session: null, isLoading: false, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function SessionProvider({ children }: SessionProviderProps) {
  if (Platform.OS === "web") {
    return <WebSessionProvider>{children}</WebSessionProvider>;
  }
  return <NativeSessionProvider>{children}</NativeSessionProvider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}





