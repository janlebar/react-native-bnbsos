// Avatar.tsx

import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
} from "react-native";

type AvatarRootProps = {
  children: React.ReactNode;
  size?: number;
  style?: ViewStyle;
};

const Avatar = ({ children, size = 40, style }: AvatarRootProps) => {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

type AvatarImageProps = {
  source: ImageSourcePropType;
  size?: number;
};

const AvatarImage = ({ source, size = 40 }: AvatarImageProps) => {
  return (
    <Image
      source={source}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      resizeMode="cover"
    />
  );
};

type AvatarFallbackProps = {
  fallback: string;
  size?: number;
};

const AvatarFallback = ({ fallback, size = 40 }: AvatarFallbackProps) => {
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.fallbackText}>
        {fallback.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    overflow: "hidden",
    backgroundColor: "#e1e1e1",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

const AvatarGroup = {
  Root: Avatar,
  Image: AvatarImage,
  Fallback: AvatarFallback,
};

export default AvatarGroup;
export { Avatar, AvatarImage, AvatarFallback };
