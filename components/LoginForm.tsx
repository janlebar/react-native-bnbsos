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
import { useRouter } from "expo-router";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [isContractor, setIsContractor] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, reset } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
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
          // NextAuth handles session via HTTP-only cookies
          // No need to store tokens manually
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
            render={({ field: { onChange, value }, fieldState: { error } }) => (
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
            render={({ field: { onChange, value }, fieldState: { error } }) => (
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

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isPending}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            contentStyle={{ backgroundColor: "black" }}
          >
            Login
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
});
