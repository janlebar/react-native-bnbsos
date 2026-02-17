import React from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function AuthenticatedLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.replace("/login");
    return null;
  }

  return <Stack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
