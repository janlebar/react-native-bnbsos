// app/(auth)/contractors/[id].tsx
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { contractorsService } from "../../../api/contractorsApi";
import { ContractorDetail } from "../../../types/home";
import { useAuth } from "../../../lib/auth-context";

const { width } = Dimensions.get("window");

interface ReviewCardProps {
  comment: string;
  rating: number;
  createdAt: string;
  userName: string;
}

function ReviewCard({ comment, rating, createdAt, userName }: ReviewCardProps) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUserName}>{userName}</Text>
        <Text style={styles.reviewRating}>⭐ {rating}/10</Text>
      </View>
      <Text style={styles.reviewComment}>{comment}</Text>
      <Text style={styles.reviewDate}>
        {new Date(createdAt).toLocaleDateString()}
      </Text>
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid contractor ID");
      setIsLoading(false);
      return;
    }

    const contractorId = parseInt(id, 10);
    if (isNaN(contractorId)) {
      setError("Invalid contractor ID");
      setIsLoading(false);
      return;
    }

    contractorsService
      .fetchContractorById(contractorId)
      .then(setContractor)
      .catch(() => setError("Contractor not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSendMessage = () => {
    if (!isSignedIn) {
      router.push("/login");
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (error || !contractor) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Contractor not found"}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
                <Text style={styles.heroBadgeText}>✓ Verified</Text>
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
            <Text style={[styles.statValue, { color: "#16a34a", fontSize: 11 }]} numberOfLines={1}>
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
                <Text style={styles.contactItem}>✉ {contractor.user.email}</Text>
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
          <Text style={styles.sectionTitle}>
            Reviews ({contractor.reviews?.length || 0})
          </Text>
          {!contractor.reviews || contractor.reviews.length === 0 ? (
            <Text style={styles.noData}>No reviews yet.</Text>
          ) : (
            <FlatList
              horizontal
              data={contractor.reviews}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ReviewCard
                  comment={item.comment}
                  rating={item.rating}
                  createdAt={item.createdAt}
                  userName={item.user.name}
                />
              )}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
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
          <Text style={styles.sendMessageText}>Send Message</Text>
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
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 16,
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
    top: 50,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  backButtonText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "600",
  },
  heroAvatarContainer: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  heroAvatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  heroAvatarFallbackText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  heroNameContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  heroName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSpecializations: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  heroBadge: {
    marginTop: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
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
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  reviewRating: {
    fontSize: 12,
    color: "#6b7280",
  },
  reviewComment: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sendMessageButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendMessageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
