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

interface BetterAuthRegisterFormProps {
  isContractor?: boolean;
}

export default function BetterAuthRegisterForm({
  isContractor = false,
}: BetterAuthRegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsPending(true);

    try {
      // Use Better Auth signUp.email method
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.data) {
        Alert.alert(
          "Success",
          "Registration successful! Please check your email for verification."
        );

        // Navigate to login page
        router.push("/login");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: isContractor ? "/contractors" : "/home",
      });
    } catch (error: any) {
      console.error("Google signup error:", error);
      Alert.alert("Google Signup Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  const handleGithubSignUp = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: isContractor ? "/contractors" : "/home",
      });
    } catch (error: any) {
      console.error("GitHub signup error:", error);
      Alert.alert("GitHub Signup Failed", error.message || "Please try again");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isContractor ? "Contractor Registration" : "User Registration"}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isPending}
        />

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

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isPending}
        />

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        {/* Social Signup Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.googleButton,
              isPending && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignUp}
            disabled={isPending}
          >
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.githubButton,
              isPending && styles.buttonDisabled,
            ]}
            onPress={handleGithubSignUp}
            disabled={isPending}
          >
            <Text style={styles.socialButtonText}>Sign up with GitHub</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.links}>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            disabled={isPending}
          >
            <Text style={styles.link}>Already have an account? Sign in</Text>
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





