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
