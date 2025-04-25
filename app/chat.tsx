import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Chat from "../app/(auth)/chat/chat";

export default function LoginScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Chat />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
});
