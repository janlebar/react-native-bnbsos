// components/home/ServiceCarousel.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
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
import TilingIcon from "../../assets/icons/tiling.svg";
import TutoringIcon from "../../assets/icons/tutoring.svg";
import CarpentryIcon from "../../assets/icons/carpentry.svg";
import GardeningIcon from "../../assets/icons/gardening.svg";
import ElderlyCareIcon from "../../assets/icons/elderly_care.svg";
import FoundationIcon from "../../assets/icons/foundation.svg";
import FacadesIcon from "../../assets/icons/facades.svg";
import WindowInstallerIcon from "../../assets/icons/window_installer.svg";
import BuildingDesignIcon from "../../assets/icons/building_design.svg";
import BlindShutterServicesIcon from "../../assets/icons/blind_shutter_services.svg";
import CanopyIcon from "../../assets/icons/canopy.svg";
import OtherIcon from "../../assets/icons/other.svg";

// Map keys to SVG icon components (mirrors /api/mobile/contractors/categories)
const CATEGORY_ICONS: Record<string, React.FC<SvgProps>> = {
  carpentry: CarpentryIcon,
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
  tiling: TilingIcon,
  gardening: GardeningIcon,
  tutoring: TutoringIcon,
  elderly_care: ElderlyCareIcon,
  foundation: FoundationIcon,
  facades: FacadesIcon,
  window_installer: WindowInstallerIcon,
  building_design: BuildingDesignIcon,
  blind_shutter_services: BlindShutterServicesIcon,
  canopy: CanopyIcon,
  other: OtherIcon,
};

// Calculate responsive item width to show 3-4 items at once
const screenWidth = Dimensions.get("window").width;
const CONTAINER_PADDING = 48; // 24px on each side
const ITEM_SPACING = 8;
const ITEMS_VISIBLE = 3.5;
const ITEM_WIDTH = (screenWidth - CONTAINER_PADDING) / ITEMS_VISIBLE;
// One item (+ its gap) per snap — matches the web carousel's one-slide-at-a-time feel.
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_SPACING;
// Auto-advance cadence from the web `mainCarousel.tsx` (AUTO_SCROLL_INTERVAL_MS).
const AUTO_SCROLL_INTERVAL_MS = 4000;

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
  const listRef = useRef<FlatList<ServiceCategory>>(null);
  // Highest index that can still be left-aligned (last full "page").
  const maxStartIndex = Math.max(
    0,
    categories.length - Math.ceil(ITEMS_VISIBLE)
  );

  // Track the current item via refs so the auto-scroll interval closure stays fresh.
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Reset when the list of categories changes.
  useEffect(() => {
    currentIndexRef.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [categories.length]);

  // Auto-slide forward one item every 4s, looping back to the start.
  // Pauses while the user is dragging (the mobile analogue of the web's
  // hover/focus pause) and resumes after the momentum settles.
  useEffect(() => {
    if (categories.length <= Math.ceil(ITEMS_VISIBLE)) return;

    const intervalId = setInterval(() => {
      if (isPausedRef.current) return;

      const next =
        currentIndexRef.current >= maxStartIndex
          ? 0
          : currentIndexRef.current + 1;

      currentIndexRef.current = next;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [categories.length, maxStartIndex]);

  const handleScrollBeginDrag = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      currentIndexRef.current = Math.max(
        0,
        Math.min(index, Math.max(0, categories.length - 1))
      );
      setIsPaused(false);
    },
    [categories.length]
  );

  const handlePress = (key: string) => {
    // Tap same category again to deselect
    onSelectCategory(selectedCategory === key ? null : key);
  };

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={categories}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={true}
      decelerationRate="fast"
      // Slide/snap one item at a time, like the web carousel.
      snapToInterval={SNAP_INTERVAL}
      snapToAlignment="start"
      disableIntervalMomentum
      getItemLayout={(_, index) => ({
        length: SNAP_INTERVAL,
        offset: SNAP_INTERVAL * index,
        index,
      })}
      onScrollBeginDrag={handleScrollBeginDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onScrollToIndexFailed={(info) => {
        listRef.current?.scrollToOffset({
          offset: info.index * SNAP_INTERVAL,
          animated: true,
        });
      }}
      style={[styles.flatList, { backgroundColor: "transparent" }]}
      contentContainerStyle={[styles.container, { backgroundColor: "transparent" }]}
      renderItem={({ item }) => {
        const isSelected = selectedCategory === item.key;
        const IconComponent = CATEGORY_ICONS[item.key];
        return (
          <TouchableOpacity
            style={[
              styles.item,
              isSelected && styles.itemSelected,
              { backgroundColor: "transparent" },
            ]}
            onPress={() => handlePress(item.key)}
            activeOpacity={0.7}
          >
            {IconComponent ? (
              <IconComponent
                width={36}
                height={36}
                style={[styles.icon, isSelected && styles.iconSelected]}
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
