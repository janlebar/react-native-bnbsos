// chat.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import Chat from "../app/(auth)/chat/chat";

export default function MainChat() {
  return (
    <View style={styles.container}>
      <Chat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
});
