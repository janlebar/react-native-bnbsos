import React, { createContext, useContext, ReactNode } from "react";
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

export function SessionProvider({ children }: SessionProviderProps) {
  // authClient is configured with `credentials: "omit"` on web (see lib/auth-client.ts)
  // to prevent the CORS preflight error on GET /api/auth/get-session.
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

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}





