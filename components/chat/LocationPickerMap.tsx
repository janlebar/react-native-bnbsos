import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import MapView, { Marker, Region, MapPressEvent } from "react-native-maps";
import { useDeviceLocation } from "../../hooks/useDeviceLocation";

interface LocationPickerMapProps {
  onLocationChange: (latitude: number, longitude: number) => void;
  initialRegion?: Region;
}

// Default center: London (same as Leaflet default center={[51.5, -0.09]})
const DEFAULT_REGION: Region = {
  latitude: 51.5,
  longitude: -0.09,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPickerMap({
  onLocationChange,
  initialRegion = DEFAULT_REGION,
}: LocationPickerMapProps) {
  const mapRef = useRef<MapView>(null);
  const { requestLocation, isLoading, error } = useDeviceLocation();

  const [markerCoords, setMarkerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState<Region>(initialRegion);

  // Auto-locate on mount (equivalent to map.locate() in Leaflet)
  useEffect(() => {
    handleLocateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = async () => {
    const coords = await requestLocation();
    if (!coords) return;

    const newRegion: Region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setMarkerCoords({ latitude: coords.latitude, longitude: coords.longitude });
    onLocationChange(coords.latitude, coords.longitude);

    // Animate map to user's location (equivalent to map.flyTo in Leaflet)
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  // Handle map tap to place/move the marker (equivalent to useMapEvents click)
  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoords({ latitude, longitude });
    onLocationChange(latitude, longitude);
  };

  // Handle marker drag end (equivalent to Leaflet marker dragend event)
  const handleMarkerDragEnd = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoords({ latitude, longitude });
    onLocationChange(latitude, longitude);
  };

  // Web fallback: show manual entry UI
  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>
          Interactive map not available on web. Please use manual entry below.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {markerCoords && (
          <Marker
            coordinate={markerCoords}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            title="Selected location"
            description="Drag to adjust"
          />
        )}
      </MapView>

      {/* "Use My Location" button — equivalent to auto-locate on mount */}
      <TouchableOpacity
        style={styles.locateMeButton}
        onPress={handleLocateMe}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.locateMeText}>📍 Use My Location</Text>
        )}
      </TouchableOpacity>

      {/* Display selected coordinates */}
      {markerCoords && (
        <View style={styles.coordsBar}>
          <Text style={styles.coordsText}>
            {markerCoords.latitude.toFixed(6)}, {markerCoords.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tap hint */}
      {!markerCoords && !isLoading && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Tap on the map to select a location</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 340,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  locateMeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    minWidth: 48,
    alignItems: "center",
  },
  locateMeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  coordsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  coordsText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "monospace",
  },
  errorBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(220,38,38,0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
  },
  hintBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },
  webFallback: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  webFallbackText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
