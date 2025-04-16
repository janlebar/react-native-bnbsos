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

// import React from "react";
// import { View, StyleSheet, TouchableOpacity } from "react-native";
// import { deleteToken } from "../../utils/secureStore";
// import { useRouter } from "expo-router";
// import LogoutIcon from "../assets/icons/logout.svg";

// export default function FooterMenu() {
//   const router = useRouter();

//   const handleLogout = async () => {
//     await deleteToken();
//     router.replace("/login");
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={handleLogout}>
//         <LogoutIcon width={28} height={28} />
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
// });
