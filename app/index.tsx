//app/index.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Logo from "../assets/logo/BnbSos.svg";
import React, { useState, useEffect } from "react";

export default function WelcomeScreen() {
  const router = useRouter();
  const [typedText, setTypedText] = useState("");
  const fullText = "Hi there! Let us find a handyman for your BnB!";

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      index++;
      if (index <= fullText.length) {
        setTypedText(fullText.substring(0, index));
      } else {
        clearInterval(typingInterval);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <View style={styles.container}>
      <Logo width={400} height={400} />
      <Text style={styles.animatedText}>{typedText}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18181b",
  },
  animatedText: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
