import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth-context";
import SettingsIcon from "../assets/icons/settings.svg";
import ContractorSettingsIcon from "../assets/icons/contractor_settings.svg";
import ChevronRightIcon from "../assets/icons/chevron_right.svg";
import FooterMenu, { FOOTER_HEIGHT } from "./user/footerMenu";
import { RoleSwitchButton } from "../components/RoleSwitchButton";

const links = [
  { href: "/settings", title: "Account Settings" },
  { href: "/contractor", title: "Contractor Settings" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handlePress = (href: string) => {
    router.push(href);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: FOOTER_HEIGHT }]}
      >
        {/* User Info and Role Switch Section */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <RoleSwitchButton />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings Links */}
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
  userSection: {
    padding: 20,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
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
