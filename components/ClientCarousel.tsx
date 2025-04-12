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
import dataMap from "../data/dataMap";

interface ClientCarouselProps {
  images: { src: string; title: string }[];
  location: string;
  isSignedIn: boolean;
}

const screenWidth = Dimensions.get("window").width;

export default function ClientCarousel({
  images,
  location,
  isSignedIn,
}: ClientCarouselProps) {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null
  );

  const handleCarouselButtonClick = (title: string) => {
    for (const [key, value] of dataMap.entries()) {
      if (
        value.profession &&
        typeof value.profession === "string" &&
        value.profession.toLowerCase() === title.toLowerCase()
      ) {
        setSelectedProfession(key);
        console.log("Profession selected:", key);
        return;
      }
    }
    console.log("No match found for title:", title);
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Carousel
        loop
        mode="parallax"
        width={screenWidth * 0.8}
        height={220}
        autoPlay={false}
        pagingEnabled
        snapEnabled
        data={images}
        scrollAnimationDuration={600}
        style={{ flexGrow: 0 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.slide}
            onPress={() => handleCarouselButtonClick(item.title)}
          >
            <Image source={{ uri: item.src }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 200,
    width: screenWidth * 0.75,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: 60,
    height: 60,
    marginBottom: 10,
    resizeMode: "contain",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
});
