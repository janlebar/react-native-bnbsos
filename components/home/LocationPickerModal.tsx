// components/home/LocationPickerModal.tsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  europeanRegions,
  getFilteredRegions,
  type Region,
} from "../../lib/locations";

interface Props {
  visible: boolean;
  selectedRegionId: string | null;
  selectedCityId: string | null;
  /** Regions that actually have contractors (from the backend). */
  regions?: Region[];
  /** True while available regions are still loading. */
  loading?: boolean;
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
  regions = europeanRegions,
  loading = false,
  onSelect,
  onClear,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(
    selectedRegionId
  );

  const rows = useMemo<Row[]>(() => {
    const hasQuery = query.trim().length > 0;
    const filtered = getFilteredRegions(query, regions);

    if (hasQuery) {
      const flat: Row[] = [];
      filtered.forEach((region) => {
        flat.push({
          key: `region-${region.id}`,
          type: "region",
          regionId: region.id,
          label: region.name,
          sublabel: "Region",
        });
        region.cities.forEach((city) => {
          flat.push({
            key: `city-${region.id}-${city.id}`,
            type: "city",
            regionId: region.id,
            cityId: city.id,
            label: city.name,
            sublabel: region.name,
          });
        });
      });
      return flat;
    }

    const grouped: Row[] = [];
    filtered.forEach((region) => {
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
  }, [query, expandedRegionId, regions]);

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
            <Text style={styles.clearText}>Use my current location</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={styles.loadingText}>Loading locations…</Text>
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No locations found</Text>
              }
              renderItem={({ item }) =>
                item.type === "region" ? (
                  <View
                    style={[styles.row, isSelected(item) && styles.rowSelected]}
                  >
                    {/* Tapping the region selects the whole region (web parity) */}
                    <TouchableOpacity
                      style={styles.regionLabelArea}
                      onPress={() => {
                        onSelect(item.regionId, null);
                        onClose();
                      }}
                    >
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {item.sublabel ? (
                        <Text style={styles.rowSub}>{item.sublabel}</Text>
                      ) : null}
                    </TouchableOpacity>
                    {/* Chevron browses the region's cities (hidden while searching) */}
                    {!query.trim() && (
                      <TouchableOpacity
                        hitSlop={8}
                        style={styles.chevronButton}
                        onPress={() =>
                          setExpandedRegionId((prev) =>
                            prev === item.regionId ? null : item.regionId
                          )
                        }
                      >
                        <Text style={styles.chevron}>
                          {expandedRegionId === item.regionId ? "▾" : "▸"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.cityRow,
                      isSelected(item) && styles.rowSelected,
                    ]}
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
          )}
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
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    paddingVertical: 32,
    fontSize: 14,
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
  regionLabelArea: {
    flex: 1,
  },
  chevronButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
