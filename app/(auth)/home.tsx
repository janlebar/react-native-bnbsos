import React, { useEffect, useState } from "react";
import { View, StyleSheet, Button } from "react-native";
import ClientCarousel from "../../components/ClientCarousel";
import { getCarouselImages } from "../../data/carouselData";
import { auth } from "../../lib/auth";
import { deleteToken } from "../../utils/secureStore";
import { SvgProps } from "react-native-svg";
import { useRouter } from "expo-router";

type CarouselImage = {
  Icon: React.FC<SvgProps>;
  title: string;
};

export default function Home() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const session = await auth();
      setIsSignedIn(!!session);
      const imgs = getCarouselImages();
      setImages(imgs);
    }

    fetchData();
  }, []);

  const handleLogout = async () => {
    await deleteToken();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <ClientCarousel
        images={images}
        location="Ljubljana"
        isSignedIn={isSignedIn}
      />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#f5f5f5" },
});
