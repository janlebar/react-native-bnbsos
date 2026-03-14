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
      icon: "📊",
    },
    {
      title: "Collaborations",
      description: "Manage group chats and collaborations",
      route: "/contractors/collaborations",
      color: "#10b981",
      icon: "👥",
    },
    {
      title: "Projects",
      description: "Browse and bid on open projects",
      route: "/contractors/projects",
      color: "#f59e0b",
      icon: "🏗️",
    },
  ];

  return (
    <ContractorRouteGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{contractorName}</Text>
          {contractorCity && (
            <Text style={styles.locationText}>📍 {contractorCity}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tools</Text>
          <Text style={styles.sectionDescription}>
            Access your contractor utilities and manage your business
          </Text>

          <View style={styles.cardsContainer}>
            {navigationCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.card, { borderLeftColor: card.color }]}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription}>
                      {card.description}
                    </Text>
                  </View>
                  <Text style={styles.cardArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact support for assistance.
          </Text>
        </View>
      </ScrollView>
    </ContractorRouteGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    fontSize: 32,
    marginRight: 16,
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
