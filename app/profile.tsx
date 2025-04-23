import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import SettingsIcon from "../assets/icons/settings.svg";
import ContractorSettingsIcon from "../assets/icons/contractor_settings.svg";
import ChevronRightIcon from "../assets/icons/chevron_right.svg";
import FooterMenu from "./user/footerMenu";

const links = [
  { href: "/server", title: "Server" },
  { href: "/client", title: "Client" },
  { href: "/admin", title: "Admin" },
  { href: "/settings", title: "Account Settings" },
  { href: "/contractor", title: "Contractor Settings" },
];

export default function ProfileScreen() {
  const router = useRouter();

  const handlePress = (href: string) => {
    router.push(href);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.href}
            style={styles.item}
            onPress={() => handlePress(link.href)}
          >
            <View style={styles.left}>
              {link.href === "/settings" ? (
                <SettingsIcon width={24} height={24} style={styles.icon} />
              ) : link.href === "/contractor" ? (
                <ContractorSettingsIcon
                  width={24}
                  height={24}
                  style={styles.icon}
                />
              ) : (
                <Text style={styles.emoji}>🔗</Text>
              )}
              <Text style={styles.title}>{link.title}</Text>
            </View>
            <ChevronRightIcon width={18} height={18} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FooterMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    color: "#222",
  },
});
