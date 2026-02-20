// components/home/ServiceCarousel.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ServiceCategory } from "../../types/home";

// Map keys to emoji icons for fallback when SVG is not available
const CATEGORY_ICONS: Record<string, string> = {
  car_washing_and_detailing: "🚗",
  cleaning_services: "🧹",
  electrical_services: "⚡",
  fencing: "🏗️",
  house_sitting: "🏠",
  lawn_mowing: "🌿",
  house_painting: "🎨",
  personal_shopping: "🛍️",
  plumbing: "🔧",
  roofing: "🏚️",
  snow_removal: "❄️",
  tiling: "🪟",
  tree_pruning: "🌳",
  tutoring: "📚",
  other: "✨",
};

interface ServiceCarouselProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onSelectCategory: (key: string | null) => void;
}

export default function ServiceCarousel({
  categories,
  selectedCategory,
  onSelectCategory,
}: ServiceCarouselProps) {
  const handlePress = (key: string) => {
    // Tap same category again to deselect
    onSelectCategory(selectedCategory === key ? null : key);
  };

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const isSelected = selectedCategory === item.key;
        return (
          <TouchableOpacity
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => handlePress(item.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{CATEGORY_ICONS[item.key] || "🔨"}</Text>
            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  itemSelected: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    color: "#374151",
    fontWeight: "500",
  },
  labelSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
});
