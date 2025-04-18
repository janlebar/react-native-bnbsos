import React, { useState, useTransition } from "react";
import { View, Text, StyleSheet, Switch, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { registerApi } from "../api/auth"; // hypothetical API
import { saveToken } from "../utils/secureStore";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  phone?: string;
  specialization?: string;
  yearsOfExperience?: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const [isContractor, setIsContractor] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, reset } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      address: "",
      city: "",
      phone: "",
      specialization: "",
      yearsOfExperience: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerApi({ ...values, isContractor })
        .then(async (response) => {
          await saveToken(response.token);
          setSuccess("Account created successfully!");
          reset();
          router.replace("/(auth)/home");
        })
        .catch(() => setError("Something went wrong, please try again"));
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create an Account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Name"
            value={value}
            onChangeText={onChange}
            disabled={isPending}
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

      <View style={styles.switchRow}>
        <Text style={styles.label}>Register as Contractor</Text>
        <Switch
          value={isContractor}
          onValueChange={setIsContractor}
          disabled={isPending}
          thumbColor={isContractor ? "black" : "gray"}
          trackColor={{ false: "#ccc", true: "#444" }}
        />
      </View>

      {isContractor && (
        <>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Address"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
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
            name="city"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="City"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
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
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Phone"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
                style={styles.input}
                mode="flat"
                underlineColor="gray"
                activeUnderlineColor="black"
                textColor="black"
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="specialization"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Specialization"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
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
            name="yearsOfExperience"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Years of Experience"
                value={value}
                onChangeText={onChange}
                disabled={isPending}
                style={styles.input}
                mode="flat"
                underlineColor="gray"
                activeUnderlineColor="black"
                textColor="black"
                keyboardType="numeric"
              />
            )}
          />
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
        Create Account
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
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
});
