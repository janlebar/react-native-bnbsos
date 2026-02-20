import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import FooterMenu from "../user/footerMenu";
import ServiceCarousel from "../../components/home/ServiceCarousel";
import ContractorGrid from "../../components/home/ContractorGrid";
import SortingBar from "../../components/home/SortingBar";
import { contractorsService } from "../../api/contractorsApi";
import {
  Contractor,
  ServiceCategory,
  SortOption,
  SortDirection,
} from "../../types/home";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const isSignedIn = isAuthenticated;

  // State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("rating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await contractorsService.fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Load contractors when search params change
  useEffect(() => {
    const loadContractors = async () => {
      setIsLoading(true);
      setPage(0);
      setContractors([]);

      try {
        if (debouncedQuery || selectedCategory) {
          // Search mode
          const searchProfession = selectedCategory ? [selectedCategory] : undefined;
          const response = await contractorsService.searchContractors({
            q: debouncedQuery || undefined,
            profession: searchProfession?.join(","),
            page: 0,
            limit: 16,
          });
          setContractors(response.contractors);
          setHasMore(response.hasMore);
        } else {
          // Default list mode
          const response = await contractorsService.fetchContractors(0, 16, sortOption);
          setContractors(response.contractors);
          setHasMore(response.hasMore);
        }
      } catch (error) {
        console.error("Error loading contractors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContractors();
  }, [debouncedQuery, selectedCategory]);

  // Load more contractors
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      if (debouncedQuery || selectedCategory) {
        // Search mode
        const searchProfession = selectedCategory ? [selectedCategory] : undefined;
        const response = await contractorsService.searchContractors({
          q: debouncedQuery || undefined,
          profession: searchProfession?.join(","),
          page: nextPage,
          limit: 16,
        });
        setContractors((prev) => [...prev, ...response.contractors]);
        setHasMore(response.hasMore);
      } else {
        // Default list mode
        const response = await contractorsService.fetchContractors(
          nextPage,
          16,
          sortOption
        );
        setContractors((prev) => [...prev, ...response.contractors]);
        setHasMore(response.hasMore);
      }
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more contractors:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, debouncedQuery, selectedCategory, sortOption]);

  // Handle contractor press - navigate to detail
  const handleContractorPress = useCallback(
    (id: number) => {
      router.push(`/contractors/${id}`);
    },
    [router]
  );

  // Determine search profession and city for premium placement
  const searchProfession = useMemo(() => {
    return selectedCategory ? [selectedCategory] : undefined;
  }, [selectedCategory]);

  const showSortingBar = debouncedQuery || selectedCategory;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contractors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Service Carousel */}
        {categories.length > 0 && (
          <ServiceCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Sorting Bar (only when search is active) */}
        {showSortingBar && (
          <SortingBar
            sortOption={sortOption}
            sortDirection={sortDirection}
            onSortOptionChange={setSortOption}
            onSortDirectionToggle={() =>
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          />
        )}

        {/* Contractor Grid */}
        <ContractorGrid
          contractors={contractors}
          isSignedIn={isSignedIn}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          sortOption={sortOption}
          sortDirection={sortDirection}
          searchProfession={searchProfession}
          onLoadMore={handleLoadMore}
          onContractorPress={handleContractorPress}
        />

        {/* Footer Menu */}
        <FooterMenu />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
});
