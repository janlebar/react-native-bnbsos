// app/contractors/collaborations.tsx
// Collaborations List Screen

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
import {
  getCollaborations,
  createCollaboration,
  deleteCollaboration,
} from "../../api/contractorApi";
import { Collaboration } from "../../api/types";
import { useAuth } from "../../lib/auth-context";

export default function CollaborationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborations = async () => {
    try {
      setError(null);
      const result = await getCollaborations();
      setCollaborations(result.collaborations);
    } catch (err: any) {
      console.error("Error loading collaborations:", err);
      setError(err.message || "Failed to load collaborations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCollaborations();
  };

  const handleCollaborationPress = (collaborationId: string) => {
    router.push(`/contractors/collaboration/${collaborationId}`);
  };

  const handleDelete = async (collaborationId: string) => {
    try {
      await deleteCollaboration(collaborationId);
      setCollaborations(
        collaborations.filter((c) => c.id !== collaborationId)
      );
    } catch (err: any) {
      console.error("Error deleting collaboration:", err);
      setError(err.message || "Failed to delete collaboration");
    }
  };

  const renderCollaboration = ({ item }: { item: Collaboration }) => {
    const isCreator = item.createdById === user?.id;
    const participantCount = item.participants.length;
    const lastMessage =
      item.messages && item.messages.length > 0
        ? item.messages[item.messages.length - 1]
        : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCollaborationPress(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title}>
            {item.title || "Untitled Collaboration"}
          </Text>
          {isCreator && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.participants}>
          {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </Text>
        {lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage.text}
          </Text>
        )}
        <Text style={styles.date}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ContractorRouteGuard>
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading collaborations...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadCollaborations}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={collaborations}
            keyExtractor={(item) => item.id}
            renderItem={renderCollaboration}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No collaborations yet</Text>
                <Text style={styles.emptySubtext}>
                  Create a collaboration to start working with other contractors
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  participants: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
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
