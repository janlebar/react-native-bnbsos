// lib/useContractorAccess.ts
// Hook to check if current user can access contractor utilities

import { useMemo } from "react";
import { useAuth } from "./auth-context";

export interface ContractorAccessResult {
  canAccess: boolean;
  reason?: string;
  isLoading: boolean;
}

/**
 * Hook to check if the current user can access contractor utilities.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have isContractor === true
 * - User must have a contractor profile that is confirmed
 * 
 * @returns {ContractorAccessResult} Access check result with reason if denied
 */
export function useContractorAccess(): ContractorAccessResult {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    // Still loading auth state
    if (isLoading) {
      return {
        canAccess: false,
        reason: "Checking authentication...",
        isLoading: true,
      };
    }

    // Not authenticated
    if (!user) {
      return {
        canAccess: false,
        reason: "You must be logged in to access contractor utilities.",
        isLoading: false,
      };
    }

    // Not a contractor
    if (!user.isContractor) {
      return {
        canAccess: false,
        reason: "You must be logged in as a contractor to access these features.",
        isLoading: false,
      };
    }

    // No contractor profile
    if (!user.contractor) {
      return {
        canAccess: false,
        reason: "No contractor profile found. Please complete contractor onboarding.",
        isLoading: false,
      };
    }

    // Contractor profile not confirmed
    if (!user.contractor.confirmed) {
      return {
        canAccess: false,
        reason: "Your contractor profile is not yet confirmed. Please complete onboarding or check your email.",
        isLoading: false,
      };
    }

    // All checks passed
    return {
      canAccess: true,
      isLoading: false,
    };
  }, [user, isLoading]);
}
