import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

interface LocationPickerModalProps {
  onClose: () => void;
  onSend: (lat: number, lng: number) => void;
}

export default function LocationPickerModal({
  onClose,
  onSend,
}: LocationPickerModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to share your location."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setManualLat(loc.coords.latitude.toFixed(6));
      setManualLng(loc.coords.longitude.toFixed(6));
    } catch (err) {
      Alert.alert("Error", "Failed to get current location.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng });
    } else {
      Alert.alert("Invalid Coordinates", "Please enter valid latitude and longitude.");
    }
  };

  const handleSend = () => {
    if (location) {
      onSend(location.lat, location.lng);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Get current location button */}
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={isLoading}
            style={styles.gpsButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome5 name="location-arrow" size={16} color="#fff" />
            )}
            <Text style={styles.gpsButtonText}>
              {isLoading ? "Getting location…" : "Use Current Location"}
            </Text>
          </TouchableOpacity>

          {/* Manual entry */}
          <Text style={styles.orText}>— or enter coordinates manually —</Text>
          <View style={styles.coordRow}>
            <TextInput
              style={styles.coordInput}
              placeholder="Latitude"
              keyboardType="numeric"
              value={manualLat}
              onChangeText={setManualLat}
            />
            <TextInput
              style={styles.coordInput}
              placeholder="Longitude"
              keyboardType="numeric"
              value={manualLng}
              onChangeText={setManualLng}
            />
          </View>
          <TouchableOpacity onPress={handleManualEntry} style={styles.setButton}>
            <Text style={styles.setButtonText}>Set Location</Text>
          </TouchableOpacity>

          {/* Preview */}
          {location && (
            <View style={styles.preview}>
              <FontAwesome5 name="map-marker-alt" size={14} color="#2563eb" />
              <Text style={styles.previewText}>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </Text>
            </View>
          )}

          {/* Send */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!location}
            style={[styles.sendButton, !location && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>Send Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  gpsButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gpsButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  orText: { textAlign: "center", color: "#9ca3af", fontSize: 12 },
  coordRow: { flexDirection: "row", gap: 8 },
  coordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
  },
  setButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  setButtonText: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 6,
  },
  previewText: { fontSize: 12, color: "#1e40af", fontFamily: "monospace" },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  sendButtonDisabled: { backgroundColor: "#93c5fd" },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

