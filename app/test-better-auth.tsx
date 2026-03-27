// M-1 Security fix: this screen must never be accessible in production builds.
// It exposes Better Auth session state, authentication flows, and API connectivity.
if (!__DEV__) {
  throw new Error(
    "[Security] Test screen /test-better-auth is not available in production builds."
  );
}

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import BetterAuthDemo from "../components/BetterAuthDemo";
import { useSession } from "../components/SessionProvider";

export default function TestBetterAuth() {
  const router = useRouter();
  const { session } = useSession();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Better Auth Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Current Session Status</Text>
        {session ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>✅ Authenticated</Text>
            <Text style={styles.userInfo}>
              User: {session.user?.name || session.user?.email}
            </Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>❌ Not Authenticated</Text>
            <Text style={styles.userInfo}>Please log in to test features</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.navButtonText}>Go to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.navButtonText}>Go to Register</Text>
          </TouchableOpacity>
        </View>

        <BetterAuthDemo />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#1f2937",
  },
  statusContainer: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    color: "#6b7280",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  navButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});





