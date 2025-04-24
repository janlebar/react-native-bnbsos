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
import { loginApi } from "../api/auth";
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

  const { control, handleSubmit, reset } = useForm<LoginFormValues>({
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

    startTransition(() => {
      loginApi({
        email,
        password,
        isContractor,
      })
        .then(async (response) => {
          if (response.twoFactorRequired) {
            setShowTwoFactor(true);
            return;
          }
          await saveToken(response.token);
          setSuccess("Login successful!");
          reset();
          router.replace("/(auth)/home");
        })
        .catch(() => setError("Invalid credentials or something went wrong"));
    });
  };

  const navigateToRegister = () => {
    router.push("/register");
  };
  const navigateToForgotPassword = () => {
    router.push("/reset-password");
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
          <Text style={styles.header}>Welcome Back</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {!showTwoFactor && (
            <>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    disabled={isPending}
                    autoCapitalize="none"
                    style={styles.input}
                    mode="flat"
                    underlineColor="gray"
                    activeUnderlineColor="black"
                    textColor="black"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
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
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Two-Factor Code"
                  value={value}
                  onChangeText={onChange}
                  disabled={isPending}
                  style={styles.input}
                  mode="flat"
                  underlineColor="gray"
                  activeUnderlineColor="black"
                  textColor="black"
                  placeholder="12345"
                />
              )}
            />
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
            {showTwoFactor ? "Confirm" : "Login"}
          </Button>

          <TouchableOpacity onPress={navigateToRegister} disabled={isPending}>
            <Text style={styles.registerLink}>
              Don't have an account? Register here!
            </Text>
          </TouchableOpacity>
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
  input: { marginBottom: 16, backgroundColor: "transparent" },
  button: { marginTop: 24, borderRadius: 8 },
  buttonLabel: { color: "white", fontSize: 16, fontWeight: "bold" },
  error: { color: "red", marginBottom: 16, textAlign: "center" },
  success: { color: "green", marginBottom: 16, textAlign: "center" },
  label: { color: "black", fontSize: 16 },
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
});
