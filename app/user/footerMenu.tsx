// footerMenu.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { deleteToken } from "../../utils/secureStore";
import { useRouter } from "expo-router";
import LogoutIcon from "../../assets/icons/logout.svg";
import ProfileIcon from "../../assets/icons/profile.svg";
import ChatBubble from "../../assets/icons/chat_bubble.svg";

export default function FooterMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    await deleteToken();
    router.replace("/login");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleChat = () => {
    router.push("/chat");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleProfile}>
        <ProfileIcon width={24} height={24} style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <LogoutIcon width={24} height={24} style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleChat}>
        <ChatBubble width={24} height={24} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    backgroundColor: "#f44336",
  },
  icon: {
    color: "#fff",
  },
});
