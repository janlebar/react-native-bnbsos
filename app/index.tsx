import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import ClientCarousel from "../components/ClientCarousel";
import { getCarouselImages } from "../data/carouselData";
import { auth } from "../lib/auth";

type CarouselImage = {
  src: string;
  title: string;
};

export default function Home() {
  const [images, setImages] = useState<CarouselImage[]>([]);
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

// import React from "react";
// import { View, StyleSheet } from "react-native";
// import MainPage from "../components/MainPage";

// export default function Home() {
//   return (
//     <View style={styles.container}>
//       <MainPage />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });
// import { View, Text, StyleSheet } from "react-native";

// export default function Page() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Kera jajca</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   text: {
//     fontSize: 40,
//     fontWeight: "bold",
//   },
// });

// import Carousel from "react-native-snap-carousel";

// export class MyCarousel extends Component {
//   _renderItem = ({ item, index }) => {
//     return (
//       <View style={styles.slide}>
//         <Text style={styles.title}>{item.title}</Text>
//       </View>
//     );
//   };

//   render() {
//     return (
//       <Carousel
//         ref={(c) => {
//           this._carousel = c;
//         }}
//         data={this.state.entries}
//         renderItem={this._renderItem}
//         sliderWidth={sliderWidth}
//         itemWidth={itemWidth}
//       />
//     );
//   }
// }
