// app/contractors/analytics.tsx
// Contractor Analytics Dashboard

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ContractorRouteGuard } from "../../components/ContractorRouteGuard";
import { getContractorAnalytics } from "../../api/contractorApi";
import { ContractorAnalytics } from "../../api/types";

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<ContractorAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const result = await getContractorAnalytics();
      setAnalytics(result.data);
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  return (
    <ContractorRouteGuard>
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : analytics ? (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <View style={styles.section}>
              <Text style={styles.title}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.totalConversations}
                  </Text>
                  <Text style={styles.statLabel}>Conversations</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.totalMessages}
                  </Text>
                  <Text style={styles.statLabel}>Messages</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.averageRating.toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.totalReviews}
                  </Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.favoritedCount}
                  </Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {analytics.overview.premiumPlacement ? "Yes" : "No"}
                  </Text>
                  <Text style={styles.statLabel}>Premium</Text>
                </View>
              </View>
            </View>

            {analytics.topSpecializations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.title}>Top Specializations</Text>
                {analytics.topSpecializations.map((spec) => (
                  <View key={spec.name} style={styles.specRow}>
                    <Text style={styles.specName}>{spec.name}</Text>
                    <Text style={styles.specCount}>{spec.count}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.title}>Response Time</Text>
              <Text style={styles.text}>
                Average: {analytics.responseTimeData.averageResponseTime} hours
              </Text>
              <Text style={styles.text}>
                Response Rate:{" "}
                {analytics.responseTimeData.responseRatePercentage}%
              </Text>
            </View>

            {analytics.reviewsData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.title}>Recent Reviews</Text>
                {analytics.reviewsData.slice(0, 5).map((review, index) => (
                  <View key={index} style={styles.reviewCard}>
                    <Text style={styles.reviewRating}>
                      {review.rating}/10 ⭐
                    </Text>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </ContractorRouteGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1f2937",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  specName: {
    fontSize: 16,
    textTransform: "capitalize",
    color: "#1f2937",
  },
  specCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  text: {
    fontSize: 16,
    marginVertical: 4,
    color: "#374151",
  },
  reviewCard: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
