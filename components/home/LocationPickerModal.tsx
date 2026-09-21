// components/home/LocationPickerModal.tsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { europeanRegions, normalizeToken } from "../../lib/locations";

interface Props {
  visible: boolean;
  selectedRegionId: string | null;
  selectedCityId: string | null;
  onSelect: (regionId: string, cityId: string | null) => void;
  onClear: () => void;
  onClose: () => void;
}

interface Row {
  key: string;
  type: "region" | "city";
  regionId: string;
  cityId?: string;
  label: string;
  sublabel?: string;
}

export default function LocationPickerModal({
  visible,
  selectedRegionId,
  selectedCityId,
  onSelect,
  onClear,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(
    selectedRegionId
  );

  const rows = useMemo<Row[]>(() => {
    const q = normalizeToken(query);
    if (q) {
      const matches: Row[] = [];
      europeanRegions.forEach((region) => {
        if (normalizeToken(region.name).includes(q)) {
          matches.push({
            key: `region-${region.id}`,
            type: "region",
            regionId: region.id,
            label: region.name,
            sublabel: "Region",
          });
        }
        region.cities.forEach((city) => {
          if (
            normalizeToken(city.name).includes(q) ||
            normalizeToken(region.name).includes(q)
          ) {
            matches.push({
              key: `city-${region.id}-${city.id}`,
              type: "city",
              regionId: region.id,
              cityId: city.id,
              label: city.name,
              sublabel: region.name,
            });
          }
        });
      });
      return matches;
    }

    const grouped: Row[] = [];
    europeanRegions.forEach((region) => {
      grouped.push({
        key: `region-${region.id}`,
        type: "region",
        regionId: region.id,
        label: region.name,
        sublabel: `${region.cities.length} cities`,
      });
      if (expandedRegionId === region.id) {
        region.cities.forEach((city) => {
          grouped.push({
            key: `city-${region.id}-${city.id}`,
            type: "city",
            regionId: region.id,
            cityId: city.id,
            label: city.name,
          });
        });
      }
    });
    return grouped;
  }, [query, expandedRegionId]);

  const isSelected = (row: Row) =>
    row.type === "city"
      ? selectedCityId === row.cityId
      : selectedRegionId === row.regionId && !selectedCityId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Location</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search city or country"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9ca3af"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.clearRow} onPress={onClear}>
            <Text style={styles.clearText}>
              {selectedRegionId || selectedCityId
                ? "Use my current location"
                : "Use my current location"}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={rows}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) =>
              item.type === "region" ? (
                <TouchableOpacity
                  style={[styles.row, isSelected(item) && styles.rowSelected]}
                  onPress={() => {
                    if (query) {
                      onSelect(item.regionId, null);
                      onClose();
                    } else {
                      setExpandedRegionId((prev) =>
                        prev === item.regionId ? null : item.regionId
                      );
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {item.sublabel ? (
                      <Text style={styles.rowSub}>{item.sublabel}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>
                    {query || expandedRegionId === item.regionId ? "▾" : "▸"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.cityRow, isSelected(item) && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item.regionId, item.cityId ?? null);
                    onClose();
                  }}
                >
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {item.sublabel ? (
                    <Text style={styles.rowSub}>{item.sublabel}</Text>
                  ) : null}
                </TouchableOpacity>
              )
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  close: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "600",
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1f2937",
  },
  clearRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearText: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  rowSelected: {
    backgroundColor: "#eff6ff",
  },
  rowLabel: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },
  rowSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  chevron: {
    fontSize: 14,
    color: "#6b7280",
  },
});
