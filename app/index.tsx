import React from "react";
import { View, StyleSheet } from "react-native";
import MainPage from "../components/MainPage";

export default function Home() {
  return (
    <View style={styles.container}>
      <MainPage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
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
