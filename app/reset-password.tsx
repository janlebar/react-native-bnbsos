import React, { useState, useTransition } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { TextInput, Button } from "react-native-paper";
import { resetApi } from "../api/authapi";
import { useRouter } from "expo-router";

type ResetFormValues = {
  email: string;
};

export default function ResetForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, reset } = useForm<ResetFormValues>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: ResetFormValues) => {
    setError("");
    setSuccess("");

    const email = values.email.trim().toLowerCase();

    startTransition(() => {
      resetApi({ email })
        .then(() => {
          setSuccess("Reset email sent successfully!");
          reset();
        })
        .catch(() =>
          setError(
            "Something went wrong — please check your email and try again"
          )
        );
    });
  };

  const navigateToRegister = () => {
    router.push("/register");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Reset Password</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

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
              placeholder="name@example.com"
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          disabled={isPending}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          contentStyle={{ backgroundColor: "black" }}
        >
          Send Reset Email
        </Button>

        <TouchableOpacity onPress={navigateToRegister} disabled={isPending}>
          <Text style={styles.registerLink}>
            Don't have an account? Register here!
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  container: {
    flex: 1,
    justifyContent: "center",
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
  registerLink: {
    marginTop: 24,
    textAlign: "center",
    color: "black",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
