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
import { loginApi } from "../api/authapi";
import { LoginAs } from "../api/types";
import { useAuth } from "../lib/auth-context";
import OAuthButtons from "./OAuthButtons";
import { logger } from "../utils/logger"; // H-4: dev-gated logger

interface LoginFormProps {
  isContractor?: boolean;
}

export default function LoginForm({ isContractor = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [loginAs, setLoginAs] = useState<LoginAs>(
    isContractor ? "contractor" : "user"
  );
  // M-6: Exponential backoff state — track consecutive failures and lockout time
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const router = useRouter();
  const { signIn, refreshSession } = useAuth();

  const handleLogin = async () => {
    // M-6: Check lockout before attempting login
    if (lockedUntil && new Date() < lockedUntil) {
      const secondsRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;
      const timeMsg = minutes > 0
        ? `${minutes} minute${minutes > 1 ? "s" : ""} ${seconds > 0 ? `${seconds}s` : ""}`
        : `${seconds} second${seconds !== 1 ? "s" : ""}`;
      Alert.alert(
        "Too many login attempts",
        `Please wait ${timeMsg} before trying again.`
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsPending(true);

    try {
      // H-4: Do not log email, password, or token values.
      logger.debug("🔐 Login attempt — mode:", loginAs);

      const response = await loginApi({
        email: email.trim(),
        password,
        // Keep legacy isContractor for now, but prefer explicit loginAs
        isContractor: loginAs === "contractor" || isContractor,
        loginAs,
      });

      // Use user data from the response
      if (response.user) {
        // M-6: Reset attempt counter on successful login
        setLoginAttempts(0);
        setLockedUntil(null);

        // Sign in the user and wait for state update
        await signIn(response.user);
        
        logger.debug("✅ User signed in, navigating...");
        
        // If user is a contractor but contractor profile is missing, refresh session
        // This handles cases where backend hasn't been updated yet
        if (response.user.isContractor && response.user.contractorId && !response.user.contractor) {
          logger.debug("Contractor detected but profile missing, refreshing session...");
          try {
            await refreshSession();
          } catch (error) {
            logger.warn("Failed to refresh session, continuing anyway:", error);
            // Continue - backend may not be updated yet, but we'll try navigation
          }
        }
        
        // Use setTimeout to ensure React has re-rendered with new auth state
        // After refreshSession, the auth context will have the updated user with contractor profile
        // The ContractorRouteGuard will check the updated user from context
        setTimeout(() => {
          const effectiveLoginAs = response.loginAs || loginAs;
          const isBackendContractor = !!response.user?.isContractor;

          // Navigate based on backend-confirmed contractor status and mode
          if (
            effectiveLoginAs === "contractor" &&
            isBackendContractor
          ) {
            router.replace("/contractors");
          } else {
            router.replace("/(auth)/home");
          }
        }, 200);
      } else {
        throw new Error("No user data in response");
      }
    } catch (error: any) {
      logger.error("Login error:", error.message);

      // M-6: Increment attempt counter and apply exponential backoff
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Server-side rate limit (429) — use the server's message directly
      if (error?.code === "RATE_LIMITED") {
        Alert.alert("Too many attempts", error.message);
        return; // Don't increment client-side counter — server is already tracking
      }

      // Lock out after 5 consecutive failures: 2^(n-5) minutes, capped at 30 minutes
      if (newAttempts >= 5) {
        const lockMinutes = Math.min(Math.pow(2, newAttempts - 5), 30);
        const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
        setLockedUntil(lockUntil);
        Alert.alert(
          "Too many failed attempts",
          `Your account has been temporarily locked for ${lockMinutes} minute${lockMinutes !== 1 ? "s" : ""}. Please try again later.`
        );
      } else if (error?.code === "NO_CONTRACTOR_PROFILE") {
        Alert.alert(
          "Contractor profile not found",
          "No contractor profile found for this account. Please complete contractor onboarding."
        );
      } else if (error?.code === "CONTRACTOR_NOT_CONFIRMED") {
        Alert.alert(
          "Contractor profile not confirmed",
          "Your contractor profile is not yet confirmed. Please complete onboarding or check your email."
        );
      } else {
        Alert.alert("Login Failed", error.message || "Please try again");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleOAuthSuccess = (userData: any) => {
    signIn(userData);
    const isBackendContractor =
      typeof userData?.isContractor === "boolean"
        ? userData.isContractor
        : !!userData?.contractor;

    if (isBackendContractor) {
      router.replace("/contractors");
    } else {
      router.replace("/(auth)/home");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {loginAs === "contractor" ? "Contractor Login" : "User Login"}
      </Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginAs === "user" && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginAs("user")}
          disabled={isPending}
        >
          <Text
            style={[
              styles.toggleText,
              loginAs === "user" && styles.toggleTextActive,
            ]}
          >
            User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            loginAs === "contractor" && styles.toggleButtonActive,
          ]}
          onPress={() => setLoginAs("contractor")}
          disabled={isPending}
        >
          <Text
            style={[
              styles.toggleText,
              loginAs === "contractor" && styles.toggleTextActive,
            ]}
          >
            Contractor
          </Text>
        </TouchableOpacity>
      </View>

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

        <OAuthButtons
          isContractor={isContractor}
          disabled={isPending}
          onSuccess={handleOAuthSuccess}
        />

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
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  toggleButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  toggleText: {
    color: "#111827",
  },
  toggleTextActive: {
    color: "#ffffff",
    fontWeight: "600",
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
