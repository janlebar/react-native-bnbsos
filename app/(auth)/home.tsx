import React, { useEffect, useState } from "react";
import ClientCarousel from "../../components/ClientCarousel";
import { getCarouselImages } from "../../data/carouselData";
import { auth } from "../../lib/auth";
import { SvgProps } from "react-native-svg";
import FooterMenu from "../user/footerMenu";
import ContractorsList from "../contractors/contractors";
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ListRenderItemInfo,
} from "react-native";

type CarouselImage = {
  Icon: React.FC<SvgProps>;
  title: string;
};

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

  const renderEmpty = () => <View />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={[]}
          renderItem={renderEmpty}
          ListHeaderComponent={
            <>
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
            </>
          }
          contentContainerStyle={styles.content}
          ListFooterComponent={<FooterMenu />}
        />
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
  },
  content: {
    paddingBottom: 120,
    paddingTop: 60,
  },
});
