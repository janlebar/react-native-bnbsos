import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "../lib/auth-client";

interface BetterAuthLoginFormProps {
  isContractor?: boolean;
}

export default function BetterAuthLoginForm({
  isContractor = false,
}: BetterAuthLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsPending(true);

    try {
      // Use Better Auth signIn.email method
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.data) {
        Alert.alert("Success", "Login successful!");

        // Navigate based on user type
        if (isContractor) {
          router.replace("/contractors/contractors");
        } else {
          router.replace("/(auth)/home");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: isContractor ? "/contractors" : "/home",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      Alert.alert("Google Login Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: isContractor ? "/contractors" : "/home",
      });
    } catch (error: any) {
      console.error("GitHub login error:", error);
      Alert.alert("GitHub Login Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isContractor ? "Contractor Login" : "User Login"}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isPending}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isPending}
        />

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Social Login Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.googleButton,
              isPending && styles.buttonDisabled,
            ]}
            onPress={handleGoogleLogin}
            disabled={isPending}
          >
            <Text style={styles.socialButtonText}>Login with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.githubButton,
              isPending && styles.buttonDisabled,
            ]}
            onPress={handleGithubLogin}
            disabled={isPending}
          >
            <Text style={styles.socialButtonText}>Login with GitHub</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.links}>
          <TouchableOpacity
            onPress={() => router.push("/register")}
            disabled={isPending}
          >
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/reset-password")}
            disabled={isPending}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  form: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  socialButtons: {
    gap: 10,
    marginBottom: 20,
  },
  socialButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "#4285f4",
  },
  githubButton: {
    backgroundColor: "#333333",
  },
  socialButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  links: {
    alignItems: "center",
    gap: 10,
  },
  link: {
    color: "#3b82f6",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});





