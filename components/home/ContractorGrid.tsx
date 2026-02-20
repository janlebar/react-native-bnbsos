// components/home/ContractorGrid.tsx
import React, { useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { Contractor, SortOption, SortDirection } from "../../types/home";
import ContractorCard from "./ContractorCard";
import { applyPremiumPlacement } from "../../utils/premiumPlacement";

interface ContractorGridProps {
  contractors: Contractor[];
  isSignedIn: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  sortOption: SortOption;
  sortDirection: SortDirection;
  searchProfession?: string[];
  searchCity?: string;
  onLoadMore: () => void;
  onContractorPress: (id: number) => void;
  onFavoritePress?: (id: number) => void;
}

export default function ContractorGrid({
  contractors,
  isSignedIn,
  isLoading,
  isLoadingMore,
  hasMore,
  sortOption,
  sortDirection,
  searchProfession,
  searchCity,
  onLoadMore,
  onContractorPress,
  onFavoritePress,
}: ContractorGridProps) {
  // Apply premium placement
  const placedContractors = useMemo(() => {
    return applyPremiumPlacement(contractors, searchProfession, searchCity);
  }, [contractors, searchProfession, searchCity]);

  // Sort positions 9+ (non-premium row) by selected option
  const sortedContractors = useMemo(() => {
    if (placedContractors.length <= 8) return placedContractors;

    const premiumRow = placedContractors.slice(0, 8);
    const rest = placedContractors.slice(8);

    const sortedRest = [...rest].sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "rating":
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case "experience":
          comparison =
            (a.yearsOfExperience || 0) - (b.yearsOfExperience || 0);
          break;
        case "availability":
          comparison = (a.availability || "").localeCompare(
            b.availability || ""
          );
          break;
        case "certifications":
          comparison =
            (a.certifications?.length || 0) - (b.certifications?.length || 0);
          break;
        case "description":
          comparison = (a.description || "").localeCompare(
            b.description || ""
          );
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return [...premiumRow, ...sortedRest];
  }, [placedContractors, sortOption, sortDirection]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (sortedContractors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No contractors found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedContractors}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ContractorCard
            contractor={item}
            isSignedIn={isSignedIn}
            isPremiumRow={index < 8}
            onPress={onContractorPress}
            onFavoritePress={onFavoritePress}
          />
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMore}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignSelf: "center",
    marginVertical: 16,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
