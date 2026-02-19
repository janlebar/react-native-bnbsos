import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

interface LocationMessageProps {
  text: string; // The full message text: "📍 Location: https://www.google.com/maps?q=lat,lng"
}

function extractCoordinates(
  text: string
): { lat: number; lng: number; url: string } | null {
  const match = text.match(
    /Location: (https:\/\/www\.google\.com\/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+))/
  );
  if (match) {
    return {
      url: match[1],
      lat: parseFloat(match[2]),
      lng: parseFloat(match[3]),
    };
  }
  return null;
}

export default function LocationMessage({ text }: LocationMessageProps) {
  const coords = extractCoordinates(text);

  if (!coords) {
    return <Text style={styles.fallback}>{text}</Text>;
  }

  const openInMaps = () => {
    Linking.openURL(coords.url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="map-marker-alt" size={14} color="#2563eb" />
        <Text style={styles.label}>Shared Location</Text>
      </View>

      {/* Coordinates display */}
      <Text style={styles.coords}>
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </Text>

      {/* Open in Maps button */}
      <TouchableOpacity onPress={openInMaps} style={styles.mapButton}>
        <Text style={styles.mapButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
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
  },
  mapButton: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: 4,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  fallback: {
    fontSize: 13,
    color: "#374151",
  },
});

