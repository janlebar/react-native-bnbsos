// footerMenu.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { deleteToken } from "../../utils/secureStore";
import { useRouter } from "expo-router";
import LogoutIcon from "../../assets/icons/logout.svg";
import ProfileIcon from "../../assets/icons/profile.svg";

export default function FooterMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    await deleteToken();
    router.replace("/login");
  };

  const handleProfile = () => {
    router.push("/profile");
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

// import React from "react";
// import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
// import { deleteToken } from "../../utils/secureStore";
// import { useRouter } from "expo-router";
// import ElectricianIcon from "../../assets/icons/logout.svg";

// export default function FooterMenu() {
//   const router = useRouter();

//   const handleLogout = async () => {
//     await deleteToken();
//     router.replace("/login");
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//         <ElectricianIcon width={24} height={24} style={styles.icon} />
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     padding: 16,
//     backgroundColor: "#eee",
//   },
//   logoutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f44336",
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   icon: {
//     color: "#fff",
//   },
// });
