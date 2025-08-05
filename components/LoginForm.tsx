import React, { useState, useTransition } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { TextInput, Button } from "react-native-paper";
import { loginApi } from "../api/authapi";
import { saveToken } from "../utils/secureStore";
import { useRouter } from "expo-router";

type LoginFormValues = {
  email: string;
  password: string;
  code: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isContractor, setIsContractor] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [tempCredentials, setTempCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError("");
    setSuccess("");

    const email = values.email.trim().toLowerCase();
    const password = values.password.trim();

    if (showTwoFactor) {
      // Handle two-factor authentication
      startTransition(() => {
        if (!tempCredentials) {
          setError("Please try logging in again");
          setShowTwoFactor(false);
          return;
        }

        loginApi({
          email: tempCredentials.email,
          password: tempCredentials.password,
          isContractor,
          code: values.code, // Add code to the API call
        })
          .then(async (response) => {
            await saveToken(response.token);
            setSuccess("Login successful!");
            reset();
            setTempCredentials(null);
            setShowTwoFactor(false);
            router.replace("/(auth)/home");
          })
          .catch((error) => {
            setError(error.message || "Invalid two-factor code");
          });
      });
    } else {
      // Initial login attempt
      startTransition(() => {
        loginApi({
          email,
          password,
          isContractor,
        })
          .then(async (response) => {
            if (response.twoFactorRequired) {
              setShowTwoFactor(true);
              setTempCredentials({ email, password });
              setValue("code", "");
              return;
            }
            await saveToken(response.token);
            setSuccess("Login successful!");
            reset();
            router.replace("/(auth)/home");
          })
          .catch((error) => {
            setError(
              error.message || "Invalid credentials or something went wrong"
            );
          });
      });
    }
  };

  const navigateToRegister = () => {
    router.push("/register");
  };

  const navigateToForgotPassword = () => {
    router.push("/reset-password");
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTempCredentials(null);
    setError("");
    setSuccess("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.header}>
            {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {!showTwoFactor && (
            <>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <TextInput
                      label="Email"
                      value={value}
                      onChangeText={onChange}
                      disabled={isPending}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                      mode="flat"
                      underlineColor="gray"
                      activeUnderlineColor="black"
                      textColor="black"
                    />
                    {error && (
                      <Text style={styles.fieldError}>{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <TextInput
                      label="Password"
                      value={value}
                      onChangeText={onChange}
                      disabled={isPending}
                      secureTextEntry
                      style={styles.input}
                      mode="flat"
                      underlineColor="gray"
                      activeUnderlineColor="black"
                      textColor="black"
                    />
                    {error && (
                      <Text style={styles.fieldError}>{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={navigateToForgotPassword}
                disabled={isPending}
              >
                <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Log in as Contractor</Text>
                <Switch
                  value={isContractor}
                  onValueChange={setIsContractor}
                  disabled={isPending}
                  thumbColor={isContractor ? "black" : "gray"}
                  trackColor={{ false: "#ccc", true: "#444" }}
                />
              </View>
            </>
          )}

          {showTwoFactor && (
            <>
              <Text style={styles.twoFactorText}>
                Please enter the verification code sent to your email.
              </Text>

              <Controller
                control={control}
                name="code"
                rules={{
                  required: "Verification code is required",
                  minLength: {
                    value: 4,
                    message: "Code must be at least 4 characters",
                  },
                }}
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <TextInput
                      label="Verification Code"
                      value={value}
                      onChangeText={onChange}
                      disabled={isPending}
                      style={styles.input}
                      mode="flat"
                      underlineColor="gray"
                      activeUnderlineColor="black"
                      textColor="black"
                      placeholder="Enter your code"
                      keyboardType="number-pad"
                    />
                    {error && (
                      <Text style={styles.fieldError}>{error.message}</Text>
                    )}
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={handleBackToLogin}
                disabled={isPending}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isPending}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={{ backgroundColor: "black" }}
          >
            {showTwoFactor ? "Verify Code" : "Login"}
          </Button>

          {!showTwoFactor && (
            <TouchableOpacity onPress={navigateToRegister} disabled={isPending}>
              <Text style={styles.registerLink}>
                Don't have an account? Register here!
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    padding: 24,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    color: "black",
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  success: {
    color: "green",
    marginBottom: 16,
    textAlign: "center",
  },
  fieldError: {
    color: "red",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
  },
  label: {
    color: "black",
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    justifyContent: "space-between",
  },
  registerLink: {
    marginTop: 24,
    textAlign: "center",
    color: "black",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  forgotPasswordLink: {
    marginTop: 24,
    textAlign: "center",
    color: "black",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  twoFactorText: {
    textAlign: "center",
    color: "black",
    fontSize: 16,
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backButtonText: {
    color: "black",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
