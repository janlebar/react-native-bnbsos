// app/contractors/projects.tsx
// Open Projects List Screen

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ContractorRouteGuard } from "../../components/ContractorRouteGuard";
import { getOpenProjects } from "../../api/contractorApi";
import { Project } from "../../api/types";

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setError(null);
      const result = await getOpenProjects();
      setProjects(result.projects);
    } catch (err: any) {
      console.error("Error loading projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const handleProjectPress = (projectId: string) => {
    router.push(`/contractors/project/${projectId}`);
  };

  const renderProject = ({ item }: { item: Project }) => {
    const bidCount = item._count?.estimates || item.estimates?.length || 0;
    const lowestBid =
      item.estimates && item.estimates.length > 0
        ? item.estimates[0].amount
        : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleProjectPress(item.id)}
      >
        <Text style={styles.title}>{item.title}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {item.city || "Location TBD"}
          </Text>
          {bidCount > 0 && (
            <Text style={styles.metaText}>
              {bidCount} bid{bidCount !== 1 ? "s" : ""}
            </Text>
          )}
          {lowestBid && (
            <Text style={styles.metaText}>
              Lowest: ${(lowestBid / 100).toLocaleString()}
            </Text>
          )}
        </View>
        {item.budgetMin && item.budgetMax && (
          <Text style={styles.budget}>
            Budget: ${(item.budgetMin / 100).toLocaleString()} - $
            {(item.budgetMax / 100).toLocaleString()}
          </Text>
        )}
        {item.requiredSpecializations.length > 0 && (
          <View style={styles.specializations}>
            {item.requiredSpecializations.slice(0, 3).map((spec, index) => (
              <View key={index} style={styles.specTag}>
                <Text style={styles.specText}>{spec}</Text>
              </View>
            ))}
            {item.requiredSpecializations.length > 3 && (
              <Text style={styles.moreSpecs}>
                +{item.requiredSpecializations.length - 3} more
              </Text>
            )}
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ContractorRouteGuard>
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadProjects}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={renderProject}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No open projects</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for new project opportunities
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
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
  retryButton: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  budget: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  specializations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  specTag: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  specText: {
    fontSize: 12,
    color: "#1e40af",
    textTransform: "capitalize",
  },
  moreSpecs: {
    fontSize: 12,
    color: "#6b7280",
    alignSelf: "center",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    textTransform: "uppercase",
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
});
