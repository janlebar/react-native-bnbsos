//MainPage.tsx
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";

const { width: screenWidth } = Dimensions.get("window");

const data = [{ title: "Item 1" }, { title: "Item 2" }, { title: "Item 3" }];

const MainPage = () => {
  return (
    <View style={styles.container}>
      <Carousel
        width={screenWidth * 0.75}
        height={200}
        data={data}
        mode="parallax"
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  slide: {
    backgroundColor: "#87ceeb",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});
