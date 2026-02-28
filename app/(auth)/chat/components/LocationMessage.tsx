import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { parseLocationMessage } from "../../../../utils/locationUtils";
import LocationMessageMap from "../../../../components/chat/LocationMessageMap";

interface LocationMessageProps {
  text: string; // The full message text: "📍 Location: https://www.google.com/maps?q=lat,lng"
}

export default function LocationMessage({ text }: LocationMessageProps) {
  const locationData = parseLocationMessage(text);

  if (!locationData) {
    return <Text style={styles.fallback}>{text}</Text>;
  }

  const openInMaps = () => {
    Linking.openURL(locationData.url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="map-marker-alt" size={14} color="#2563eb" />
        <Text style={styles.label}>Shared Location</Text>
      </View>

      {/* Coordinates display */}
      <Text style={styles.coords}>
        {locationData.latitude.toFixed(5)}, {locationData.longitude.toFixed(5)}
      </Text>

      {/* Inline map display */}
      <LocationMessageMap
        latitude={locationData.latitude}
        longitude={locationData.longitude}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 10,
    maxWidth: 260,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  coords: {
    fontSize: 11,
    color: "#6b7280",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  fallback: {
    fontSize: 13,
    color: "#374151",
  },
});

