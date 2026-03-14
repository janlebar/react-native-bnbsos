// components/ContractorRouteGuard.tsx
// Route guard component that protects contractor utility screens

import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useContractorAccess } from "../lib/useContractorAccess";

interface ContractorRouteGuardProps {
  children: ReactNode;
}

/**
 * Route guard component that ensures only contractors with confirmed profiles
 * can access protected contractor utility screens.
 * 
 * Shows loading state while checking, error screen if access denied,
 * and renders children if access is granted.
 */
export function ContractorRouteGuard({
  children,
}: ContractorRouteGuardProps) {
  const { canAccess, reason, isLoading } = useContractorAccess();
  const router = useRouter();

  // Still checking access
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  // Access denied - show error screen
  if (!canAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>{reason}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonTextSecondary}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Access granted - render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    alignItems: "center",
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "600",
  },
});
