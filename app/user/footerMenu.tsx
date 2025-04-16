// footerMenu.tsx

import React from "react";
import { View, StyleSheet, Button } from "react-native";
import { deleteToken } from "../../utils/secureStore";
import { useRouter } from "expo-router";

export default function FooterMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    await deleteToken();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={handleLogout} />
      {/* You can add more buttons here later */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#eee",
  },
});
