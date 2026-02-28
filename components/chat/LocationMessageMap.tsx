import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getMapsUrl } from "../../utils/locationUtils";

interface LocationMessageMapProps {
  latitude: number;
  longitude: number;
}

// Opens the coordinates in the platform's native Maps app
const openInMaps = (latitude: number, longitude: number) => {
  const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
  const url = getMapsUrl(latitude, longitude, platform);

  Linking.openURL(url).catch(() => {
    // Fallback to web Google Maps if native app not available
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
  });
};

export default function LocationMessageMap({
  latitude,
  longitude,
}: LocationMessageMapProps) {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Web fallback: show coordinates + link only
  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webCoords}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
        <TouchableOpacity
          style={styles.openButton}
          onPress={() => openInMaps(latitude, longitude)}
          activeOpacity={0.7}
        >
          <Text style={styles.openButtonText}>🗺️ Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Read-only map (equivalent to scrollWheelZoom={false} in Leaflet) */}
      <MapView
        style={styles.map}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none"
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Shared location"
        />
      </MapView>

      {/* "Open in Maps" button — equivalent to web "View on Google Maps" link */}
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => openInMaps(latitude, longitude)}
        activeOpacity={0.7}
      >
        <Text style={styles.openButtonText}>🗺️ Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 4,
  },
  map: {
    width: "100%",
    height: 160,
  },
  openButton: {
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  openButtonText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  webContainer: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  webCoords: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
    textAlign: "center",
  },
});
