// components/home/ServiceCarousel.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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

// Calculate responsive item width to show 3-4 items at once
const screenWidth = Dimensions.get("window").width;
const CONTAINER_PADDING = 48; // 24px on each side
const ITEM_SPACING = 8;
const ITEMS_VISIBLE = 3.5;
const ITEM_WIDTH = (screenWidth - CONTAINER_PADDING) / ITEMS_VISIBLE;

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
    // 🔴 RED = FlatList outer wrapper
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={true}
      decelerationRate="fast"
      style={[styles.flatList, { backgroundColor: "transparent" }]}
      // 🟠 ORANGE = contentContainer (paddingHorizontal/paddingVertical applied here)
      contentContainerStyle={[styles.container, { backgroundColor: "transparent" }]}
      renderItem={({ item }) => {
        const isSelected = selectedCategory === item.key;
        const IconComponent = CATEGORY_ICONS[item.key];
        return (
          // 🟡 YELLOW = each TouchableOpacity item
          <TouchableOpacity
            style={[styles.item, isSelected && styles.itemSelected, { backgroundColor: "transparent" }]}
            onPress={() => handlePress(item.key)}
            activeOpacity={0.7}
          >
            {IconComponent ? (
              <IconComponent
                width={36}
                height={36}
                style={[
                  styles.icon,
                  isSelected && styles.iconSelected,
                ]}
              />
            ) : (
              <Text style={styles.iconFallback}>✨</Text>
            )}
            {/* 🟢 GREEN = label text */}
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
  flatList: {
    marginVertical: 0,
    paddingVertical: 0,
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  item: {
    // alignSelf: "flex-start",
    alignItems: "center",
    // justifyContent: "flex-start",
    width: ITEM_WIDTH,
    paddingTop: 6,
    // paddingBottom: 1,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginRight: ITEM_SPACING,
  },
  itemSelected: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  icon: {
    marginBottom: 2,
  },
  iconSelected: {
    opacity: 1,
  },
  iconFallback: {
    fontSize: 32,
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    color: "#374151",
    fontWeight: "500",
    lineHeight: 14,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
  },
  labelSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
});
