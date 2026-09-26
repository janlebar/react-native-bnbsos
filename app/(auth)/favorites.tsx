// app/(auth)/favorites.tsx
// Saved contractors — mirrors the web /favorites page.

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import ContractorGrid from "../../components/home/ContractorGrid";
import FooterMenu, { FOOTER_HEIGHT } from "../user/footerMenu";
import { useFavorites } from "../../lib/favorites-context";

export default function FavoritesScreen() {
  const router = useRouter();
  const { contractors, isLoading, refresh, canUseFavorites } = useFavorites();

  // Refresh whenever the screen regains focus (e.g. after toggling elsewhere).
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleContractorPress = useCallback(
    (id: number) => {
      router.push(`/(auth)/contractors/${id}`);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!canUseFavorites ? (
        <View style={styles.center}>
          <Text style={styles.emptyHeart}>🙁</Text>
          <Text style={styles.emptyTitle}>Favorites unavailable</Text>
          <Text style={styles.emptySubtitle}>
            Favorites are only available when you are signed in as a customer.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.back()}
          >
            <Text style={styles.browseButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && contractors.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your favorites…</Text>
        </View>
      ) : contractors.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyHeart}>🤍</Text>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on a contractor to save them here.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(auth)/home")}
          >
            <Text style={styles.browseButtonText}>Browse Contractors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.countText}>
            You have {contractors.length} favorite contractor
            {contractors.length !== 1 ? "s" : ""}
          </Text>
          <ContractorGrid
            contractors={contractors}
            isSignedIn
            isLoading={false}
            isLoadingMore={false}
            hasMore={false}
            sortOption="rating"
            sortDirection="desc"
            onLoadMore={() => {}}
            onContractorPress={handleContractorPress}
          />
        </View>
      )}

      <FooterMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 48,
  },
  listContainer: {
    flex: 1,
    paddingBottom: FOOTER_HEIGHT,
  },
  countText: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    color: "#6b7280",
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: FOOTER_HEIGHT,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 15,
  },
  emptyHeart: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
