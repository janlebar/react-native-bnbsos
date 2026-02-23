// components/home/ServiceCarousel.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SvgProps } from "react-native-svg";
import { ServiceCategory } from "../../types/home";

// Import SVG icons
import CarWashingAndDetailingIcon from "../../assets/icons/car_washing_and_detailing.svg";
import CleaningServicesIcon from "../../assets/icons/cleaning_services.svg";
import ElectricalServicesIcon from "../../assets/icons/electrical_services.svg";
import FencingIcon from "../../assets/icons/fencing.svg";
import HouseSittingIcon from "../../assets/icons/house_sitting.svg";
import LawnMowingIcon from "../../assets/icons/lawn_mowing.svg";
import PaintingIcon from "../../assets/icons/painting.svg";
import PersonalShoppingIcon from "../../assets/icons/personal_shopping.svg";
import PlumbingIcon from "../../assets/icons/plumbing.svg";
import RoofingIcon from "../../assets/icons/roofing.svg";
import SnowRemovalIcon from "../../assets/icons/snow_removal.svg";
import TilingIcon from "../../assets/icons/tiling.svg";
import TreePruningIcon from "../../assets/icons/tree_pruning.svg";
import TutoringIcon from "../../assets/icons/tuttoring.svg";

// Map keys to SVG icon components
const CATEGORY_ICONS: Record<string, React.FC<SvgProps>> = {
  car_washing_and_detailing: CarWashingAndDetailingIcon,
  cleaning_services: CleaningServicesIcon,
  electrical_services: ElectricalServicesIcon,
  fencing: FencingIcon,
  house_sitting: HouseSittingIcon,
  lawn_mowing: LawnMowingIcon,
  house_painting: PaintingIcon,
  personal_shopping: PersonalShoppingIcon,
  plumbing: PlumbingIcon,
  roofing: RoofingIcon,
  snow_removal: SnowRemovalIcon,
  tiling: TilingIcon,
  tree_pruning: TreePruningIcon,
  tutoring: TutoringIcon,
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
        const IconComponent = CATEGORY_ICONS[item.key];
        return (
          <TouchableOpacity
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => handlePress(item.key)}
            activeOpacity={0.7}
          >
            {IconComponent ? (
              <IconComponent
                width={24}
                height={24}
                style={[
                  styles.icon,
                  isSelected && styles.iconSelected,
                ]}
              />
            ) : (
              <Text style={styles.iconFallback}>✨</Text>
            )}
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
    marginBottom: 4,
  },
  iconSelected: {
    opacity: 1,
  },
  iconFallback: {
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
