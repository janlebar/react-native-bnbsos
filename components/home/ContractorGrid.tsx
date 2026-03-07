// components/home/ContractorGrid.tsx
import React, { useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  const { width: screenWidth } = useWindowDimensions();
  
  // Responsive column calculation
  const isTablet = screenWidth >= 768;
  const isLargeTablet = screenWidth >= 1024;
  const horizontalPadding = isTablet ? 24 : 16;
  const gap = isTablet ? 16 : 12;
  
  // Minimum card width threshold (adjust based on your design needs)
  const MIN_CARD_WIDTH = 150;
  
  // Calculate optimal number of columns based on available width
  const calculateNumColumns = () => {
    if (isLargeTablet) {
      // For large tablets, try 4 columns first
      const cardWidth4 = (screenWidth - horizontalPadding * 2 - gap * 3) / 4;
      if (cardWidth4 >= MIN_CARD_WIDTH) return 4;
      
      // Try 3 columns
      const cardWidth3 = (screenWidth - horizontalPadding * 2 - gap * 2) / 3;
      if (cardWidth3 >= MIN_CARD_WIDTH) return 3;
      
      // Try 2 columns
      const cardWidth2 = (screenWidth - horizontalPadding * 2 - gap) / 2;
      if (cardWidth2 >= MIN_CARD_WIDTH) return 2;
      
      return 1;
    }
    
    if (isTablet) {
      // For tablets, try 3 columns first
      const cardWidth3 = (screenWidth - horizontalPadding * 2 - gap * 2) / 3;
      if (cardWidth3 >= MIN_CARD_WIDTH) return 3;
      
      // Try 2 columns
      const cardWidth2 = (screenWidth - horizontalPadding * 2 - gap) / 2;
      if (cardWidth2 >= MIN_CARD_WIDTH) return 2;
      
      return 1;
    }
    
    // For phones, try 2 columns first
    const cardWidth2 = (screenWidth - horizontalPadding * 2 - gap) / 2;
    if (cardWidth2 >= MIN_CARD_WIDTH) return 2;
    
    return 1;
  };
  
  const numColumns = calculateNumColumns();
  
  // Apply premium placement
  const placedContractors = useMemo(() => {
    return applyPremiumPlacement(contractors, searchProfession, searchCity);
  }, [contractors, searchProfession, searchCity]);

  // Sort positions after premium row by selected option
  // Premium row size adapts to number of columns
  const premiumRowSize = numColumns * 2; // 2 rows of premium cards
  
  const sortedContractors = useMemo(() => {
    if (placedContractors.length <= premiumRowSize) return placedContractors;

    const premiumRow = placedContractors.slice(0, premiumRowSize);
    const rest = placedContractors.slice(premiumRowSize);

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
  }, [placedContractors, sortOption, sortDirection, premiumRowSize]);

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
        key={`grid-${numColumns}`}
        data={sortedContractors}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ContractorCard
            contractor={item}
            isSignedIn={isSignedIn}
            isPremiumRow={index < premiumRowSize}
            onPress={onContractorPress}
            onFavoritePress={onFavoritePress}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingHorizontal: horizontalPadding,
            paddingTop: isTablet ? 12 : 8,
          },
        ]}
        columnWrapperStyle={
          numColumns > 1
            ? [
                styles.row,
                {
                  gap,
                  paddingBottom: gap / 2,
                },
              ]
            : undefined
        }
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
