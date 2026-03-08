// app/(auth)/contractors/[id].tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Dimensions,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { contractorsService } from "../../../api/contractorsApi";
import { ContractorDetail, Review } from "../../../types/home";
import { useAuth } from "../../../lib/auth-context";

const { width } = Dimensions.get("window");

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const userName = review.user.name || "Anonymous";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {review.user.image ? (
          <Image
            source={{ uri: review.user.image }}
            style={styles.reviewAvatar}
          />
        ) : (
          <View style={styles.reviewAvatarFallback}>
            <Text style={styles.reviewAvatarText}>{userInitial}</Text>
          </View>
        )}
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUserName}>{userName}</Text>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.reviewRating}>
          <Text style={styles.reviewRatingText}>⭐ {review.rating}/10</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
}

export default function ContractorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isSignedIn = isAuthenticated;

  const [contractor, setContractor] = useState<ContractorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContractor = useCallback(async () => {
    if (!id) {
      setError("Invalid contractor ID");
      setIsLoading(false);
      return;
    }

    const contractorId = parseInt(id, 10);
    if (isNaN(contractorId) || contractorId <= 0) {
      setError(`Invalid contractor ID: ${id}`);
      setIsLoading(false);
      return;
    }

    console.log(`[ContractorDetail] Loading contractor with ID: ${contractorId}`);

    try {
      setError(null);
      const data = await contractorsService.fetchContractorById(contractorId);
      console.log(`[ContractorDetail] Successfully loaded contractor: ${data.name}`);
      setContractor(data);
    } catch (err: any) {
      console.error("[ContractorDetail] Error loading contractor:", err);
      
      // Extract more detailed error message
      const errorMessage = err.message || "Failed to load contractor. Please try again.";
      setError(errorMessage);
      
      // Log more details for debugging
      if (err.response) {
        console.error("[ContractorDetail] API Error Response:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          url: err.config?.url,
        });
      } else if (err.request) {
        console.error("[ContractorDetail] No response received:", err.request);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    loadContractor();
  }, [loadContractor]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadContractor();
  }, [loadContractor]);

  const handleSendMessage = () => {
    if (!isSignedIn) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to send a message to this contractor.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }
    if (!contractor) return;
    // Navigate to chat screen with contractor pre-filled as receiver
    router.push({
      pathname: "/chat",
      params: {
        receiverId: contractor.uid,
        receiverName: contractor.name,
      },
    });
  };

  const handleEmailPress = async (email: string) => {
    const url = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open email client");
    }
  };

  const handleAddReview = () => {
    if (!isSignedIn) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add a review.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }
    // Navigate to add review screen (if implemented)
    Alert.alert(
      "Coming Soon",
      "The review feature will be available soon.",
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading contractor...</Text>
      </SafeAreaView>
    );
  }

  if (error || !contractor) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || "Contractor not found"}
        </Text>
        {error && error.includes("500") && (
          <Text style={styles.errorSubtext}>
            This appears to be a server error. Please try again in a moment.
          </Text>
        )}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            setError(null);
            loadContractor();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header / Hero */}
        <View style={styles.hero}>
          {contractor.backgroundImageUrl ? (
            <Image
              source={{ uri: contractor.backgroundImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder} />
          )}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.heroAvatarContainer}>
            {contractor.imageId ? (
              <Image source={{ uri: contractor.imageId }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarFallbackText}>
                  {contractor.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Name + specializations */}
          <View style={styles.heroNameContainer}>
            <Text style={styles.heroName}>{contractor.name}</Text>
            <Text style={styles.heroSpecializations}>
              {contractor.specializations?.join(" • ") || ""}
            </Text>
            {contractor.premiumPlacement && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {contractor.placementTier === "VERIFIED"
                    ? "✓ Verified"
                    : "👑 Premium"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⭐ {contractor.rating}/10</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {contractor.yearsOfExperience ?? "—"} yrs
            </Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{contractor.reviews?.length || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, styles.availabilityText]}
              numberOfLines={1}
            >
              {contractor.availability || "—"}
            </Text>
            <Text style={styles.statLabel}>Availability</Text>
          </View>
        </View>

        {/* Details section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {contractor.description ? (
            <Text style={styles.description}>{contractor.description}</Text>
          ) : (
            <Text style={styles.noData}>No description provided.</Text>
          )}
        </View>

        {/* Certifications */}
        {contractor.certifications && contractor.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.tagsRow}>
              {contractor.certifications.map((cert, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {isSignedIn ? (
            <>
              {contractor.user?.email && (
                <TouchableOpacity
                  onPress={() => handleEmailPress(contractor.user!.email!)}
                >
                  <Text style={styles.contactItem}>
                    ✉ {contractor.user.email}
                  </Text>
                </TouchableOpacity>
              )}
              {contractor.phone && (
                <Text style={styles.contactItem}>📞 {contractor.phone}</Text>
              )}
              {!contractor.user?.email && !contractor.phone && (
                <Text style={styles.noData}>No contact details available.</Text>
              )}
            </>
          ) : (
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.signInPrompt}>
                Sign in to view contact details →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.locationText}>
            📍 {contractor.address}, {contractor.city}
          </Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              Reviews ({contractor.reviews?.length || 0})
            </Text>
            {isSignedIn && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={handleAddReview}
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            )}
          </View>
          {!contractor.reviews || contractor.reviews.length === 0 ? (
            <Text style={styles.noData}>No reviews yet.</Text>
          ) : (
            <FlatList
              horizontal
              data={contractor.reviews}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={true}
              renderItem={({ item }) => <ReviewCard review={item} />}
              contentContainerStyle={styles.reviewsList}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Send Message Button */}
      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity
          style={styles.sendMessageButton}
          onPress={handleSendMessage}
        >
          <Text style={styles.sendMessageText}>
            💬 Send a message to {contractor.name}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    minWidth: 100,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  backButtonError: {
    marginTop: 8,
  },
  backLink: {
    fontSize: 14,
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  hero: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e7ff",
    position: "absolute",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  heroAvatarContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    left: "50%",
    marginLeft: -40,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#fff",
  },
  heroAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  heroAvatarFallbackText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  heroNameContainer: {
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 24,
    marginTop: 48,
  },
  heroName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSpecializations: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  heroBadge: {
    marginTop: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroBadgeText: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  availabilityText: {
    color: "#16a34a",
    fontSize: 11,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  noData: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "500",
  },
  contactItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addReviewButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addReviewButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewsList: {
    gap: 12,
    paddingRight: 16,
  },
  signInPrompt: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    color: "#374151",
  },
  reviewCard: {
    width: width * 0.75,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  reviewRating: {
    marginLeft: "auto",
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f59e0b",
  },
  reviewComment: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  sendMessageButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendMessageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
