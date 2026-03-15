// footerMenu.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import LogoutIcon from "../../assets/icons/logout.svg";
import ProfileIcon from "../../assets/icons/profile.svg";
import ChatBubble from "../../assets/icons/chat_bubble.svg";

// Export footer height constant for use in other components
export const FOOTER_HEIGHT = 68; // 12px padding top + 12px padding bottom + 44px button height (approximate)

export default function FooterMenu() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleChat = () => {
    router.push("/chat");
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={handleProfile}>
          <ProfileIcon width={24} height={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <LogoutIcon width={24} height={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleChat}>
          <ChatBubble width={24} height={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
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
});
