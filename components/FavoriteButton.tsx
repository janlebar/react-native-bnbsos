// components/FavoriteButton.tsx
import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useFavorites } from "../lib/favorites-context";

interface FavoriteButtonProps {
  contractorId: number;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
}

/**
 * Heart toggle for a contractor. Hidden when signed out OR in contractor mode
 * (favorites are a customer-facing feature, matching the web).
 */
export default function FavoriteButton({
  contractorId,
  size = "md",
  style,
}: FavoriteButtonProps) {
  const { canUseFavorites, isFavorite, toggleFavorite } = useFavorites();
  const [isBusy, setIsBusy] = useState(false);

  if (!canUseFavorites) return null;

  const favorited = isFavorite(contractorId);
  const fontSize = size === "sm" ? 15 : size === "lg" ? 26 : 20;

  const handlePress = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await toggleFavorite(contractorId);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, isBusy && styles.busy]}
      onPress={handlePress}
      disabled={isBusy}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Text style={{ fontSize }}>{favorited ? "❤️" : "🤍"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  busy: {
    opacity: 0.5,
  },
});
