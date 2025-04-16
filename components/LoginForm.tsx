import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { loginApi } from "../api/auth";
import { saveToken } from "../utils/secureStore";
import { useRouter } from "expo-router";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const token = await loginApi({ email, password });
      await saveToken(token);
      router.replace("/(auth)/home");
    } catch (e) {
      setError("Invalid credentials");
    }
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { height: 40, borderBottomWidth: 1, marginBottom: 12 },
  error: { color: "red", marginBottom: 10 },
});
