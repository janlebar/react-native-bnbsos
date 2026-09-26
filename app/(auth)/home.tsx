import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
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
import LocationPickerModal from "../../components/home/LocationPickerModal";
import {
  europeanRegions,
  getLocationLabel,
  resolveDetectedLocation,
  type DetectedLocation,
  type Region,
} from "../../lib/locations";
import { contractorsService } from "../../api/contractorsApi";
import { Contractor, ServiceCategory, SortOption, SortDirection } from "../../types/home";

export default function Home() {
  const { isAuthenticated } = useAuth();
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
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  // Regions/cities that actually have contractors (mirrors web LocationCombobox)
  const [availableRegions, setAvailableRegions] =
    useState<Region[]>(europeanRegions);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  // Geo-detected location (country → region, city name match, else first city)
  const [detectedLocation, setDetectedLocation] =
    useState<DetectedLocation | null>(null);

  // Effective search location: explicit picker selection wins, then the
  // geo-detected location (mirrors web `applyDetectedLocation`).
  const effectiveLocation = useMemo(() => {
    if (selectedCityId) {
      return {
        location: selectedCityId,
        region: selectedRegionId ?? undefined,
      };
    }
    if (selectedRegionId) {
      return { location: undefined, region: selectedRegionId };
    }
    if (detectedLocation) {
      return {
        location: detectedLocation.cityId,
        region: detectedLocation.regionId,
      };
    }
    return { location: undefined, region: undefined };
  }, [selectedCityId, selectedRegionId, detectedLocation]);

  // Human-readable label for the location selector button.
  const locationLabel = useMemo(() => {
    if (selectedCityId && selectedRegionId) {
      return getLocationLabel(selectedRegionId, selectedCityId);
    }
    if (selectedRegionId) {
      return getLocationLabel(selectedRegionId);
    }
    if (detectedLocation) {
      return getLocationLabel(
        detectedLocation.regionId,
        detectedLocation.cityId
      );
    }
    return "All locations";
  }, [selectedCityId, selectedRegionId, detectedLocation]);

  // A user-selected location/region puts the home screen into search mode
  // (web parity: HomeClient treats `location || region` as an active search).
  const hasExplicitLocation = !!(selectedCityId || selectedRegionId);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Detect device location once and resolve it to a supported region/city.
  // Mirrors web `resolveDetectedLocation` (country → region, city name match,
  // else first city in the region).
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

        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const [place] = places;
        const resolved = resolveDetectedLocation({
          city: place?.city || place?.subregion || place?.region || null,
          country: place?.isoCountryCode || place?.country || null,
        });

        if (resolved) {
          console.log("[Home] Resolved detected location:", resolved);
          setDetectedLocation(resolved);
        } else {
          console.warn(
            "[Home] Could not resolve a supported region from geocode result"
          );
        }
      } catch (error) {
        console.error("[Home] Failed to detect device location:", error);
      }
    };

    detectLocation();
  }, []);

  // Load regions/cities that actually have contractors (web parity).
  useEffect(() => {
    let cancelled = false;
    const loadLocations = async () => {
      try {
        const regions = await contractorsService.fetchAvailableLocations();
        if (!cancelled) {
          setAvailableRegions(
            regions.length > 0 ? regions : europeanRegions
          );
        }
      } catch (error) {
        console.error("Error loading available locations:", error);
      } finally {
        if (!cancelled) setLocationsLoaded(true);
      }
    };
    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

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
              effectiveLocation.location
                ? ` in "${effectiveLocation.location}"`
                : ""
            }`
          );

          const response = await contractorsService.searchContractors({
            q: debouncedQuery,
            location: effectiveLocation.location,
            region: effectiveLocation.region,
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
            `[Home] Category search profession="${selectedCategory}"${
              effectiveLocation.location || effectiveLocation.region
                ? ` in "${effectiveLocation.location ?? effectiveLocation.region}"`
                : " (no location filter)"
            }`
          );

          const response = await contractorsService.searchContractors({
            profession: selectedCategory,
            location: effectiveLocation.location,
            region: effectiveLocation.region,
            page: 0,
            limit: 16,
          });

          setContractors(response.contractors);
          setHasMore(response.hasMore);
          console.log(
            `[Home] Loaded ${response.contractors.length} contractors from category search (total: ${response.total})`
          );
        } else if (hasExplicitLocation) {
          // Location-only mode - search by the selected region/city (web parity)
          console.log(
            `[Home] Location-only search in "${
              effectiveLocation.location ?? effectiveLocation.region
            }"`
          );

          const response = await contractorsService.searchContractors({
            location: effectiveLocation.location,
            region: effectiveLocation.region,
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
  }, [
    debouncedQuery,
    selectedCategory,
    hasExplicitLocation,
    effectiveLocation,
    sortOption,
  ]);

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
          location: effectiveLocation.location,
          region: effectiveLocation.region,
          page: nextPage,
          limit: 16,
        });
        setContractors((prev) => [...prev, ...response.contractors]);
        setHasMore(response.hasMore);
      } else if (selectedCategory) {
        // Category pagination - /search with profession filter
        const response = await contractorsService.searchContractors({
          profession: selectedCategory,
          location: effectiveLocation.location,
          region: effectiveLocation.region,
          page: nextPage,
          limit: 16,
        });
        setContractors((prev) => [...prev, ...response.contractors]);
        setHasMore(response.hasMore);
      } else if (hasExplicitLocation) {
        // Location-only pagination
        const response = await contractorsService.searchContractors({
          location: effectiveLocation.location,
          region: effectiveLocation.region,
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
  }, [page, hasMore, isLoadingMore, debouncedQuery, selectedCategory, hasExplicitLocation, sortOption, effectiveLocation]);

  // Handle contractor press - navigate to detail
  const handleContractorPress = useCallback(
    (id: number) => {
      router.push(`/(auth)/contractors/${id}`);
    },
    [router]
  );

  // Determine search profession and city for premium placement
  const searchProfession = useMemo(() => {
    return selectedCategory ? [selectedCategory] : undefined;
  }, [selectedCategory]);

  const showSortingBar = debouncedQuery || selectedCategory || hasExplicitLocation;

  return (
    // 🔵 BLUE = SafeAreaView
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: "transparent" }]}>
      {/* 🟣 PURPLE = outer container View */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Header with Role Switch */}
        <View style={styles.headerContainer}>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contractors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setLocationPickerVisible(true)}
          >
            <Text style={styles.locationButtonText} numberOfLines={1}>
              📍 {locationLabel}
            </Text>
          </TouchableOpacity>
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

        <LocationPickerModal
          visible={locationPickerVisible}
          selectedRegionId={selectedRegionId}
          selectedCityId={selectedCityId}
          regions={availableRegions}
          loading={!locationsLoaded}
          onSelect={(regionId, cityId) => {
            setSelectedRegionId(regionId);
            setSelectedCityId(cityId);
          }}
          onClear={() => {
            setSelectedRegionId(null);
            setSelectedCityId(null);
          }}
          onClose={() => setLocationPickerVisible(false)}
        />
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSpacer: {
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
  locationButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
});
