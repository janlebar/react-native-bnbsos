import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LocationPickerMap from "../../../../components/chat/LocationPickerMap";

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
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const handleLocationChange = (latitude: number, longitude: number) => {
    setLocation({ lat: latitude, lng: longitude });
    setManualLat(latitude.toFixed(6));
    setManualLng(longitude.toFixed(6));
  };

  const handleManualEntry = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLocation({ lat, lng });
      } else {
        Alert.alert("Invalid Coordinates", "Latitude must be between -90 and 90, longitude between -180 and 180.");
      }
    } else {
      Alert.alert("Invalid Coordinates", "Please enter valid latitude and longitude.");
    }
  };

  const handleSend = () => {
    if (location) {
      onSend(location.lat, location.lng);
      // Reset for next open
      setLocation(null);
      setManualLat("");
      setManualLng("");
    }
  };

  const handleClose = () => {
    setLocation(null);
    setManualLat("");
    setManualLng("");
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Instruction text */}
          <Text style={styles.instruction}>
            Tap the map or use "My Location" to select a point, then tap Send.
          </Text>

          {/* Interactive map */}
          <View style={styles.mapContainer}>
            <LocationPickerMap onLocationChange={handleLocationChange} />
          </View>

          {/* Manual entry fallback */}
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

          {/* Send Location button — disabled until a location is selected */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!location}
            style={[styles.sendButton, !location && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>
              {location ? "📍 Send Location" : "Select a location first"}
            </Text>
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
  instruction: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  mapContainer: {
    marginBottom: 12,
  },
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

