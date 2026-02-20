// components/home/SortingBar.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SortOption, SortDirection } from "../../types/home";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "rating", label: "Rating" },
  { key: "experience", label: "Experience" },
  { key: "availability", label: "Availability" },
  { key: "certifications", label: "Certifications" },
  { key: "description", label: "Description" },
];

interface SortingBarProps {
  sortOption: SortOption;
  sortDirection: SortDirection;
  onSortOptionChange: (option: SortOption) => void;
  onSortDirectionToggle: () => void;
}

export default function SortingBar({
  sortOption,
  sortDirection,
  onSortOptionChange,
  onSortDirectionToggle,
}: SortingBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = sortOption === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSortOptionChange(option.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, isSelected && styles.pillTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={styles.directionButton}
        onPress={onSortDirectionToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.directionButtonText}>
          {sortDirection === "asc" ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pills: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  pillText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  directionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginLeft: 8,
  },
  directionButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
});
