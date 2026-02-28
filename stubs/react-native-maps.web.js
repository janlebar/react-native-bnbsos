// Stub for react-native-maps on web
// This prevents bundling errors when Expo Router scans app/ directory

import { View, Text } from "react-native";

export const MapView = ({ children, style, ...props }) => (
  <View style={[{ backgroundColor: "#e5e7eb", minHeight: 200 }, style]}>
    <Text style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
      Map preview not available on web
    </Text>
    {children}
  </View>
);

export const Marker = ({ children, ...props }) => (
  <View>{children}</View>
);

export default MapView;
