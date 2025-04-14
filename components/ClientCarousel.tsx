//ClientCarousel.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

interface ClientCarouselProps {
  images: { src: string; title: string }[];
  location: string;
  isSignedIn: boolean;
}

const screenWidth = Dimensions.get("window").width;
const ITEM_WIDTH = screenWidth * 0.75;
const SPACING = 16;

export default function ClientCarousel({
  images,
  location,
  isSignedIn,
}: ClientCarouselProps) {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null
  );

  const handleCarouselButtonClick = (title: string) => {
    console.log("Clicked:", title);
    // Your logic here
  };

  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Carousel
        loop
        width={ITEM_WIDTH + SPACING}
        height={240}
        autoPlay={false}
        pagingEnabled
        snapEnabled
        mode="parallax"
        data={images}
        scrollAnimationDuration={700}
        renderItem={({ item, index, animationValue }) => {
          const animatedStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              animationValue.value,
              [-1, 0, 1],
              [0.85, 1, 0.85],
              Extrapolate.CLAMP
            );
            return {
              transform: [{ scale }],
            };
          });

          return (
            <Animated.View style={[styles.slide, animatedStyle]}>
              <TouchableOpacity
                style={styles.touchable}
                onPress={() => handleCarouselButtonClick(item.title)}
              >
                <Image source={{ uri: item.src }} style={styles.image} />
                <Text style={styles.title}>{item.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: ITEM_WIDTH,
    height: 200,
    marginHorizontal: SPACING / 2,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  touchable: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  image: {
    width: 64,
    height: 64,
    resizeMode: "contain",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
});
