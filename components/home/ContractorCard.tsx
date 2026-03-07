// components/home/ContractorCard.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Contractor } from "../../types/home";

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2; // 2-column grid with padding

interface ContractorCardProps {
  contractor: Contractor;
  isSignedIn: boolean;
  isPremiumRow: boolean; // true if position 0–7
  onPress: (id: number) => void;
  onFavoritePress?: (id: number) => void;
}

function PremiumBadge({ tier }: { tier: string }) {
  return (
    <View style={styles.premiumBadge}>
      <Text style={styles.premiumBadgeText}>👑 Premium</Text>
    </View>
  );
}

function VerifiedBadge() {
  return (
    <View style={styles.verifiedBadge}>
      <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
    </View>
  );
}

export default function ContractorCard({
  contractor,
  isSignedIn,
  isPremiumRow,
  onPress,
  onFavoritePress,
}: ContractorCardProps) {
  const hasPremiumBadge =
    contractor.premiumPlacement &&
    contractor.placementTier &&
    contractor.placementTier !== "VERIFIED";

  const hasVerifiedBadge = contractor.premiumPlacement;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        contractor.premiumPlacement && styles.premiumCard,
      ]}
      onPress={() => onPress(contractor.id)}
      activeOpacity={0.85}
    >
      {/* Background + Avatar Section */}
      <View style={styles.imageSection}>
        {contractor.backgroundImageUrl ? (
          <Image
            source={{ uri: contractor.backgroundImageUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.backgroundPlaceholder} />
        )}
        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Premium badge */}
        {hasPremiumBadge && contractor.placementTier && (
          <PremiumBadge tier={contractor.placementTier} />
        )}

        {/* Favorite button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onFavoritePress(contractor.id)}
          >
            <Text>🤍</Text>
          </TouchableOpacity>
        )}

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {contractor.imageId ? (
            <Image
              source={{ uri: contractor.imageId }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {contractor.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Verified badge */}
        {hasVerifiedBadge && <VerifiedBadge />}

        {/* Name and specializations overlay */}
        <View style={styles.nameOverlay}>
          <Text style={styles.contractorName} numberOfLines={1}>
            {contractor.name}
          </Text>
          <Text style={styles.specializations} numberOfLines={1}>
            {contractor.specializations?.join(", ") || ""}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Rating */}
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>⭐ {contractor.rating ?? "N/A"}/10</Text>
          <Text style={styles.infoLabel}>Rating</Text>
        </View>

        {/* Experience */}
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>
            {contractor.yearsOfExperience ?? "—"} yrs
          </Text>
          <Text style={styles.infoLabel}>Experience</Text>
        </View>

        {/* Availability */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoValue, styles.availabilityText]} numberOfLines={1}>
            {contractor.availability || "—"}
          </Text>
          <Text style={styles.infoLabel}>Availability</Text>
        </View>

        {/* Certifications */}
        {contractor.certifications && contractor.certifications.length > 0 && (
          <View style={styles.certRow}>
            {contractor.certifications.slice(0, 2).map((cert, i) => (
              <View key={i} style={styles.certBadge}>
                <Text style={styles.certText} numberOfLines={1}>{cert}</Text>
              </View>
            ))}
            {contractor.certifications.length > 2 && (
              <Text style={styles.moreCerts}>
                +{contractor.certifications.length - 2}
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        {contractor.description && (
          <Text style={styles.description} numberOfLines={2}>
            {contractor.description}
          </Text>
        )}

        {/* Contact info — signed-in only */}
        <View style={styles.contactSection}>
          {isSignedIn ? (
            <>
              {contractor.user?.email && (
                <Text style={styles.contactEmail} numberOfLines={1}>
                  ✉ {contractor.user.email}
                </Text>
              )}
              {contractor.phone && (
                <Text style={styles.contactPhone}>📞 {contractor.phone}</Text>
              )}
            </>
          ) : (
            <Text style={styles.signInPrompt}>Sign in to view contact</Text>
          )}
        </View>

        {/* Address */}
        <Text style={styles.address} numberOfLines={1}>
          📍 {contractor.address}, {contractor.city}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: "#fbbf24",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.3,
  },
  imageSection: {
    height: 140,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  backgroundPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e7ff",
    position: "absolute",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f59e0b",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  premiumBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
  avatarContainer: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    left: "50%",
    marginLeft: -24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarFallbackText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  verifiedBadge: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    left: "50%",
    marginLeft: -30,
    marginTop: 52,
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  verifiedBadgeText: { color: "#1d4ed8", fontSize: 9, fontWeight: "600" },
  nameOverlay: {
    position: "absolute",
    bottom: 4,
    left: 6,
    right: 6,
  },
  contractorName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  specializations: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    textAlign: "center",
  },
  infoSection: {
    padding: 10,
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoValue: { fontSize: 11, fontWeight: "600", color: "#1f2937" },
  infoLabel: { fontSize: 9, color: "#9ca3af" },
  availabilityText: { color: "#16a34a" },
  certRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
  },
  certBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 70,
  },
  certText: { color: "#1e40af", fontSize: 9, fontWeight: "500" },
  moreCerts: { fontSize: 9, color: "#9ca3af", alignSelf: "center" },
  description: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 14,
  },
  contactSection: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 4,
  },
  contactEmail: { fontSize: 10, color: "#2563eb", fontWeight: "500" },
  contactPhone: { fontSize: 10, color: "#374151", fontWeight: "500" },
  signInPrompt: { fontSize: 10, color: "#2563eb", fontStyle: "italic" },
  address: { fontSize: 9, color: "#6b7280", marginTop: 2 },
});
