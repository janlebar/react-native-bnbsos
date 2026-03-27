// M-1 Security fix: this screen must never be accessible in production builds.
// It enumerates live API endpoints and exposes raw API responses.
if (!__DEV__) {
  throw new Error(
    "[Security] Test screen /test-api is not available in production builds."
  );
}

import React from "react";
import { View, StyleSheet } from "react-native";
import ApiTestComponent from "../components/ApiTestComponent";

export default function TestApiScreen() {
  return (
    <View style={styles.container}>
      <ApiTestComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
