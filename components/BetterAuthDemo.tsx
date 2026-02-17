import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useSession } from "./SessionProvider";
import { authClient } from "../lib/auth-client";

export default function BetterAuthDemo() {
  const { session, isLoading, signOut } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert("Success", "Signed out successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const handleTestAuthenticatedRequest = async () => {
    try {
      // This is just a demo - you can replace with your actual API endpoint
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: {
          Cookie: authClient.getCookie() || "",
        },
        credentials: "omit",
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          "Success",
          `Authenticated request successful: ${JSON.stringify(data)}`
        );
      } else {
        Alert.alert("Error", `Request failed: ${response.status}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to make authenticated request");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Better Auth Demo</Text>

      {session ? (
        <View style={styles.sessionContainer}>
          <Text style={styles.welcomeText}>
            Welcome, {session.user?.name || session.user?.email}!
          </Text>
          <Text style={styles.sessionText}>Email: {session.user?.email}</Text>
          <Text style={styles.sessionText}>ID: {session.user?.id}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleTestAuthenticatedRequest}
          >
            <Text style={styles.buttonText}>Test Authenticated Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noSessionContainer}>
          <Text style={styles.noSessionText}>No active session</Text>
          <Text style={styles.instructionText}>
            Please log in to test Better Auth functionality
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1f2937",
  },
  sessionContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#059669",
  },
  sessionText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#6b7280",
  },
  noSessionContainer: {
    alignItems: "center",
  },
  noSessionText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#dc2626",
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    minWidth: 200,
  },
  signOutButton: {
    backgroundColor: "#dc2626",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});





