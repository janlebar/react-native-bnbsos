//app/index.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import ClientCarousel from "../components/ClientCarousel";
import { getCarouselImages } from "../data/carouselData";
import { auth } from "../lib/auth";
import { SvgProps } from "react-native-svg";

type CarouselImage = {
  Icon: React.FC<SvgProps>;
  title: string;
};

export default function Home() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  console.log("images", images);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const session = await auth();
      setIsSignedIn(!!session);

      const imgs = getCarouselImages();
      setImages(imgs);
    }

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <ClientCarousel
        images={images}
        location="Ljubljana"
        isSignedIn={isSignedIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: "#f5f5f5",
  },
});
