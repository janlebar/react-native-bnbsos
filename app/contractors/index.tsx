// app/contractors/index.tsx
// Contractor Dashboard - Main landing page for contractors

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ContractorRouteGuard } from "../../components/ContractorRouteGuard";
import { useAuth } from "../../lib/auth-context";
import FooterMenu, { FOOTER_HEIGHT } from "../user/footerMenu";
import { RoleSwitchButton } from "../../components/RoleSwitchButton";
import AnalyticsIcon from "../../assets/icons/analytics.svg";
import ProjectsIcon from "../../assets/icons/projects.svg";
import CollaborationsIcon from "../../assets/icons/collaborations.svg";

export default function ContractorDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const contractorName = user?.contractor?.name || user?.name || "Contractor";
  const contractorCity = user?.contractor?.city || "Your City";

  const navigationCards = [
    {
      title: "Analytics",
      description: "View your performance metrics and insights",
      route: "/contractors/analytics",
      color: "#3b82f6",
      icon: AnalyticsIcon,
    },
    {
      title: "Collaborations",
      description: "Manage group chats and collaborations",
      route: "/contractors/collaborations",
      color: "#10b981",
      icon: CollaborationsIcon,
    },
    {
      title: "Projects",
      description: "Browse and bid on open projects",
      route: "/contractors/projects",
      color: "#f59e0b",
      icon: ProjectsIcon,
    },
  ];

  return (
    <ContractorRouteGuard>
      <View style={styles.wrapper}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerContent}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{contractorName}</Text>
                {contractorCity && (
                  <Text style={styles.locationText}>📍 {contractorCity}</Text>
                )}
              </View>
              <View style={styles.headerButton}>
                <RoleSwitchButton variant="compact" />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Tools</Text>
            <Text style={styles.sectionDescription}>
              Access your contractor utilities and manage your business
            </Text>

            <View style={styles.cardsContainer}>
              {navigationCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.card, { borderLeftColor: card.color }]}
                    onPress={() => router.push(card.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardIcon}>
                        <IconComponent width={32} height={32} />
                      </View>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardDescription}>
                          {card.description}
                        </Text>
                      </View>
                      <Text style={styles.cardArrow}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Contact support for assistance.
            </Text>
          </View>
        </ScrollView>
        
        {/* Footer Menu - Always at bottom */}
        <FooterMenu />
      </View>
    </ContractorRouteGuard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingBottom: FOOTER_HEIGHT + 20, // Add padding for footer menu + extra space
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flex: 1,
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  cardArrow: {
    fontSize: 24,
    color: "#9ca3af",
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});
