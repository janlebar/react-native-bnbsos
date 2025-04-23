import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import ClientCarousel from "../../components/ClientCarousel";
import { getCarouselImages } from "../../data/carouselData";
import { auth } from "../../lib/auth";
import { SvgProps } from "react-native-svg";
import FooterMenu from "../user/footerMenu";
import ContractorsList from "../contractors/contractors";

type CarouselImage = {
  Icon: React.FC<SvgProps>;
  title: string;
};

// Home.tsx
export default function Home() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null
  );

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <ClientCarousel
            images={images}
            location="Ljubljana"
            isSignedIn={isSignedIn}
            onSelectProfession={setSelectedProfession}
          />
          {selectedProfession && (
            <ContractorsList
              location="Ljubljana"
              profession={[selectedProfession]}
            />
          )}
        </View>
        <FooterMenu />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
});
