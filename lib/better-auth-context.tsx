import React, { createContext, useContext, ReactNode } from "react";
import { authClient } from "./auth-client";

interface BetterAuthContextType {
  authClient: typeof authClient;
}

const BetterAuthContext = createContext<BetterAuthContextType | undefined>(
  undefined
);

interface BetterAuthProviderProps {
  children: ReactNode;
}

export function BetterAuthProvider({ children }: BetterAuthProviderProps) {
  return (
    <BetterAuthContext.Provider value={{ authClient }}>
      {children}
    </BetterAuthContext.Provider>
  );
}

export function useBetterAuth() {
  const context = useContext(BetterAuthContext);
  if (context === undefined) {
    throw new Error("useBetterAuth must be used within a BetterAuthProvider");
  }
  return context;
}

// Re-export authClient for direct use
export { authClient };





