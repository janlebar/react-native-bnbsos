import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuth } from "../../lib/auth-context";
import FooterMenu, { FOOTER_HEIGHT } from "../user/footerMenu";
import ServiceCarousel from "../../components/home/ServiceCarousel";
import ContractorGrid from "../../components/home/ContractorGrid";
import SortingBar from "../../components/home/SortingBar";
import { contractorsService } from "../../api/contractorsApi";
import { Contractor, ServiceCategory, SortOption, SortDirection } from "../../types/home";

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
  const [deviceCity, setDeviceCity] = useState<string>("");

  // Resolve user's city: prefer profile city, otherwise device city from expo-location
  const userLocation = useMemo(() => {
    return user?.contractor?.city || deviceCity || "";
  }, [user, deviceCity]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Detect device location once and derive a city name
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[Home] Location permission status:", status);

        if (status !== "granted") {
          console.warn("[Home] Location permission not granted");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log("[Home] Raw position from getCurrentPositionAsync:", position);

        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        console.log("[Home] reverseGeocodeAsync result:", places);

        const [place] = places;

        const city =
          place?.city || place?.subregion || place?.region || place?.country || "";

        if (city) {
          console.log("[Home] Detected device city:", city);
          setDeviceCity(city);
        } else {
          console.warn("[Home] Could not resolve city from reverse geocode result");
        }
      } catch (error) {
        console.error("[Home] Failed to detect device location:", error);
      }
    };

    // Only try to detect location if we don't already have a profile city
    if (!user?.contractor?.city) {
      detectLocation();
    }
  }, [user]);

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
        if (debouncedQuery) {
          // Text search mode - use /search endpoint with q (works today)
          console.log(
            `[Home] Text search q="${debouncedQuery}"${
              userLocation ? ` in "${userLocation}"` : ""
            }`
          );

          const response = await contractorsService.searchContractors({
            q: debouncedQuery,
            location: userLocation || undefined,
            page: 0,
            limit: 16,
          });

          setContractors(response.contractors);
          setHasMore(response.hasMore);
          console.log(
            `[Home] Loaded ${response.contractors.length} contractors from text search (total: ${response.total})`
          );
        } else if (selectedCategory) {
          // Category mode - use /search endpoint with profession filter
          console.log(
            `[Home] Location debug → profileCity="${user?.contractor?.city ?? "(none)"}", deviceCity="${
              deviceCity || "(none)"
            }", userLocation="${userLocation || "(none)"}"`
          );
          console.log(
            `[Home] Category search profession="${selectedCategory}"${
              userLocation ? ` in "${userLocation}"` : " (no location filter)"
            }`
          );

          const response = await contractorsService.searchContractors({
            profession: selectedCategory,
            location: userLocation || undefined,
            page: 0,
            limit: 16,
          });

          setContractors(response.contractors);
          setHasMore(response.hasMore);
          console.log(
            `[Home] Loaded ${response.contractors.length} contractors from category search (total: ${response.total})`
          );
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
  }, [debouncedQuery, selectedCategory, userLocation, sortOption]);

  // Load more contractors
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      if (debouncedQuery) {
        // Text search pagination
        const response = await contractorsService.searchContractors({
          q: debouncedQuery,
          location: userLocation || undefined,
          page: nextPage,
          limit: 16,
        });
        setContractors((prev) => [...prev, ...response.contractors]);
        setHasMore(response.hasMore);
      } else if (selectedCategory) {
        // Category pagination - /search with profession filter
        const response = await contractorsService.searchContractors({
          profession: selectedCategory,
          location: userLocation || undefined,
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
  }, [page, hasMore, isLoadingMore, debouncedQuery, selectedCategory, sortOption, userLocation]);

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
    // 🔵 BLUE = SafeAreaView
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "transparent" }]}>
      {/* 🟣 PURPLE = outer container View */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
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

        {/* 🩷 PINK = ServiceCarousel wrapper (conditional View) */}
        {categories.length > 0 && (
          <View style={{ backgroundColor: "transparent" }}>
            <ServiceCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </View>
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
        <View style={styles.gridContainer}>
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
        </View>

        {/* Footer Menu - Always at bottom */}
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
  gridContainer: {
    flex: 1,
    paddingBottom: FOOTER_HEIGHT,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
