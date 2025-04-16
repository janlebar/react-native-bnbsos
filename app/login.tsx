import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LoginForm from "../components/LoginForm";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100, paddingHorizontal: 20 },
  title: { fontSize: 28, marginBottom: 20 },
});
