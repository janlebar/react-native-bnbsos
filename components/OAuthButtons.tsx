import React, { useState } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import { Button } from "react-native-paper";
import { AuthManager } from "../lib/auth";
import { useRouter } from "expo-router";

interface OAuthButtonsProps {
  isContractor: boolean;
  disabled?: boolean;
}

interface OAuthProvider {
  id: string;
  name: string;
  iconName?: string;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "google", name: "Google" },
  { id: "apple", name: "Apple" },
];

export default function OAuthButtons({
  isContractor,
  disabled,
}: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleOAuthLogin = async (provider: string) => {
    setLoading(provider);
    try {
      console.log(`Starting OAuth flow for ${provider}`);
      const user = await AuthManager.signInWithOAuth(provider);

      if (user) {
        Alert.alert("Success", `Welcome ${user.name}!`);
        router.replace("/(auth)/home");
      }
    } catch (error: any) {
      console.error(`OAuth login error for ${provider}:`, error);
      Alert.alert("Login Failed", error.message || "OAuth login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <View style={styles.separatorTextContainer}>
          <Text style={styles.separatorText}>Or continue with</Text>
        </View>
      </View>

      {OAUTH_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          mode="outlined"
          onPress={() => handleOAuthLogin(provider.id)}
          loading={loading === provider.id}
          disabled={disabled || loading !== null}
          style={styles.oauthButton}
          labelStyle={styles.oauthButtonLabel}
          icon={provider.iconName}
        >
          Continue with {provider.name}
        </Button>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  separator: {
    marginVertical: 16,
    position: "relative",
  },
  separatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  separatorTextContainer: {
    position: "absolute",
    top: -12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  separatorText: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  oauthButton: {
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  oauthButtonLabel: {
    color: "black",
    fontSize: 14,
  },
});
