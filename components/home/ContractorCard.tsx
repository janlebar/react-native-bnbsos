// components/home/ContractorCard.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Contractor } from "../../types/home";

interface ContractorCardProps {
  contractor: Contractor;
  isSignedIn: boolean;
  isPremiumRow: boolean; // true if position 0–7
  onPress: (id: number) => void;
  onFavoritePress?: (id: number) => void;
}


export default function ContractorCard({
  contractor,
  isSignedIn,
  isPremiumRow,
  onPress,
  onFavoritePress,
}: ContractorCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  // Responsive calculations
  const isTablet = screenWidth >= 768;
  const isLargeTablet = screenWidth >= 1024;
  const numColumns = isLargeTablet ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isTablet ? 24 : 16;
  const gap = isTablet ? 16 : 12;
  const cardWidth = (screenWidth - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;
  
  // Responsive font sizes
  const scaleFactor = isLargeTablet ? 1.2 : isTablet ? 1.1 : 1;
  const fontSize = {
    small: Math.round(9 * scaleFactor),
    medium: Math.round(10 * scaleFactor),
    regular: Math.round(11 * scaleFactor),
    large: Math.round(12 * scaleFactor),
  };
  
  // Responsive spacing
  const spacing = {
    xs: Math.round(2 * scaleFactor),
    sm: Math.round(4 * scaleFactor),
    md: Math.round(6 * scaleFactor),
    lg: Math.round(8 * scaleFactor),
    xl: Math.round(10 * scaleFactor),
  };
  
  // Responsive dimensions
  const dimensions = {
    imageHeight: isTablet ? 160 : 140,
    avatarSize: isTablet ? 56 : 48,
    borderRadius: isTablet ? 20 : 16,
    badgePadding: isTablet ? 8 : 6,
  };

  const hasPremiumBadge =
    contractor.premiumPlacement && !!contractor.placementTier;

  const hasVerifiedBadge = contractor.premiumPlacement;

  const dynamicStyles = StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: "#fff",
      borderRadius: dimensions.borderRadius,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: "#f3f4f6",
    },
    imageSection: {
      height: dimensions.imageHeight,
      position: "relative",
    },
    avatar: {
      width: dimensions.avatarSize,
      height: dimensions.avatarSize,
      borderRadius: dimensions.avatarSize / 2,
      borderWidth: 2,
      borderColor: "#fff",
    },
    avatarFallback: {
      width: dimensions.avatarSize,
      height: dimensions.avatarSize,
      borderRadius: dimensions.avatarSize / 2,
      backgroundColor: "#6366f1",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    avatarFallbackText: { 
      color: "#fff", 
      fontSize: Math.round(20 * scaleFactor), 
      fontWeight: "700" 
    },
    avatarContainer: {
      position: "absolute",
      bottom: isTablet ? 32 : 28,
      alignSelf: "center",
      left: "50%",
      marginLeft: -(dimensions.avatarSize / 2),
    },
    premiumBadge: {
      position: "absolute",
      top: spacing.lg,
      left: spacing.lg,
      backgroundColor: "#f59e0b",
      borderRadius: 20,
      paddingHorizontal: dimensions.badgePadding,
      paddingVertical: spacing.xs,
      zIndex: 10,
    },
    premiumBadgeText: { 
      color: "#fff", 
      fontSize: fontSize.small, 
      fontWeight: "700" 
    },
    favoriteButton: {
      position: "absolute",
      top: spacing.lg,
      right: spacing.lg,
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: 20,
      padding: spacing.sm,
      zIndex: 10,
    },
    verifiedBadge: {
      position: "absolute",
      bottom: isTablet ? 32 : 28,
      alignSelf: "center",
      left: "50%",
      marginLeft: -(dimensions.avatarSize / 2 + 6),
      marginTop: dimensions.avatarSize + 4,
      backgroundColor: "#dbeafe",
      borderRadius: 20,
      paddingHorizontal: dimensions.badgePadding,
      paddingVertical: spacing.xs,
    },
    verifiedBadgeText: { 
      color: "#1d4ed8", 
      fontSize: fontSize.small, 
      fontWeight: "600" 
    },
    contractorName: {
      color: "#fff",
      fontSize: fontSize.large,
      fontWeight: "700",
      textAlign: "center",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    specializations: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fontSize.medium,
      textAlign: "center",
    },
    infoSection: {
      padding: spacing.xl,
      gap: spacing.sm,
    },
    infoValue: { 
      fontSize: fontSize.regular, 
      fontWeight: "600", 
      color: "#1f2937" 
    },
    infoLabel: { 
      fontSize: fontSize.small, 
      color: "#9ca3af" 
    },
    certBadge: {
      backgroundColor: "#dbeafe",
      borderRadius: 20,
      paddingHorizontal: Math.round(5 * scaleFactor),
      paddingVertical: spacing.xs,
      maxWidth: isTablet ? 90 : 70,
    },
    certText: { 
      color: "#1e40af", 
      fontSize: fontSize.small, 
      fontWeight: "500" 
    },
    moreCerts: { 
      fontSize: fontSize.small, 
      color: "#9ca3af", 
      alignSelf: "center" 
    },
    description: {
      fontSize: fontSize.medium,
      color: "#6b7280",
      marginTop: spacing.xs,
      lineHeight: Math.round(14 * scaleFactor),
    },
    contactEmail: { 
      fontSize: fontSize.medium, 
      color: "#2563eb", 
      fontWeight: "500" 
    },
    contactPhone: { 
      fontSize: fontSize.medium, 
      color: "#374151", 
      fontWeight: "500" 
    },
    signInPrompt: { 
      fontSize: fontSize.medium, 
      color: "#2563eb", 
      fontStyle: "italic" 
    },
    address: { 
      fontSize: fontSize.small, 
      color: "#6b7280", 
      marginTop: spacing.xs 
    },
  });

  return (
    <TouchableOpacity
      style={[
        dynamicStyles.card,
        contractor.premiumPlacement && styles.premiumCard,
      ]}
      onPress={() => onPress(contractor.id)}
      activeOpacity={0.85}
    >
      {/* Background + Avatar Section */}
      <View style={dynamicStyles.imageSection}>
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
          <View style={dynamicStyles.premiumBadge}>
            <Text style={dynamicStyles.premiumBadgeText}>👑 Premium</Text>
          </View>
        )}

        {/* Favorite button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={dynamicStyles.favoriteButton}
            onPress={() => onFavoritePress(contractor.id)}
          >
            <Text>🤍</Text>
          </TouchableOpacity>
        )}

        {/* Avatar */}
        <View style={dynamicStyles.avatarContainer}>
          {contractor.imageId ? (
            <Image
              source={{ uri: contractor.imageId }}
              style={dynamicStyles.avatar}
            />
          ) : (
            <View style={dynamicStyles.avatarFallback}>
              <Text style={dynamicStyles.avatarFallbackText}>
                {contractor.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Verified badge */}
        {hasVerifiedBadge && (
          <View style={dynamicStyles.verifiedBadge}>
            <Text style={dynamicStyles.verifiedBadgeText}>✓ Verified</Text>
          </View>
        )}

        {/* Name and specializations overlay */}
        <View style={styles.nameOverlay}>
          <Text style={dynamicStyles.contractorName} numberOfLines={1}>
            {contractor.name}
          </Text>
          <Text style={dynamicStyles.specializations} numberOfLines={1}>
            {contractor.specializations?.join(", ") || ""}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={dynamicStyles.infoSection}>
        {/* Rating */}
        <View style={styles.infoRow}>
          <Text style={dynamicStyles.infoValue}>⭐ {contractor.rating ?? "N/A"}/10</Text>
          <Text style={dynamicStyles.infoLabel}>Rating</Text>
        </View>

        {/* Experience */}
        <View style={styles.infoRow}>
          <Text style={dynamicStyles.infoValue}>
            {contractor.yearsOfExperience ?? "—"} yrs
          </Text>
          <Text style={dynamicStyles.infoLabel}>Experience</Text>
        </View>

        {/* Availability */}
        <View style={styles.infoRow}>
          <Text style={[dynamicStyles.infoValue, styles.availabilityText]} numberOfLines={1}>
            {contractor.availability || "—"}
          </Text>
          <Text style={dynamicStyles.infoLabel}>Availability</Text>
        </View>

        {/* Certifications */}
        {contractor.certifications && contractor.certifications.length > 0 && (
          <View style={styles.certRow}>
            {contractor.certifications.slice(0, 2).map((cert, i) => (
              <View key={i} style={dynamicStyles.certBadge}>
                <Text style={dynamicStyles.certText} numberOfLines={1}>{cert}</Text>
              </View>
            ))}
            {contractor.certifications.length > 2 && (
              <Text style={dynamicStyles.moreCerts}>
                +{contractor.certifications.length - 2}
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        {contractor.description && (
          <Text style={dynamicStyles.description} numberOfLines={2}>
            {contractor.description}
          </Text>
        )}

        {/* Contact info — signed-in only */}
        <View style={styles.contactSection}>
          {isSignedIn ? (
            <>
              {contractor.user?.email && (
                <Text style={dynamicStyles.contactEmail} numberOfLines={1}>
                  ✉ {contractor.user.email}
                </Text>
              )}
              {contractor.phone && (
                <Text style={dynamicStyles.contactPhone}>📞 {contractor.phone}</Text>
              )}
            </>
          ) : (
            <Text style={dynamicStyles.signInPrompt}>Sign in to view contact</Text>
          )}
        </View>

        {/* Address */}
        <Text style={dynamicStyles.address} numberOfLines={1}>
          📍 {contractor.address}, {contractor.city}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumCard: {
    borderWidth: 2,
    borderColor: "#fbbf24",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.3,
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
  nameOverlay: {
    position: "absolute",
    bottom: 4,
    left: 6,
    right: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityText: { color: "#16a34a" },
  certRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
  },
  contactSection: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 4,
  },
});
