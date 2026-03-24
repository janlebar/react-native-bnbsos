// app/(auth)/contractor.tsx
// Contractor Settings Screen
//
// Connects to Next.js backend documented in:
//   next-auth/Expo_integration/profile/contractor settings/contractorSettings.md
//
// Three independent sections, each with its own save action:
//   1. Background Image  — upload / delete
//   2. Profile Info      — POST /api/mobile/profile/contractor/update
//   3. Availability      — PUT  /api/mobile/profile/contractor/availability
//
// ⚠️  Background image picking requires expo-image-picker.
//     Run: npx expo install expo-image-picker
//     then uncomment the ImagePicker block in handlePickBackground.

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getContractorSettings,
  updateContractorProfile,
  saveAvailabilitySlots,
  deleteBackgroundImage,
  type ContractorProfile,
  type AvailabilitySlot,
  type UpdateContractorProfileData,
} from "../../api/contractorSettingsApi";

// ─── Optional: uncomment after running `npx expo install expo-image-picker` ──
// import * as ImagePicker from "expo-image-picker";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers ───────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Build an ISO datetime string for the NEXT occurrence of `dayOfWeek` (0–6)
 * with the given HH:MM time components (local timezone → UTC ISO).
 */
function buildISOForSlot(dayOfWeek: number, hhmm: string): string {
  const [hhStr, mmStr] = hhmm.split(":");
  const hh = parseInt(hhStr ?? "0", 10);
  const mm = parseInt(mmStr ?? "0", 10);

  const now = new Date();
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + diff);
  target.setHours(hh, mm, 0, 0);
  return target.toISOString();
}

/** Parse an ISO datetime string back to "HH:MM" for display. */
function isoToHHMM(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "00:00";
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ContractorSettingsScreen() {
  const router = useRouter();

  // ── Remote data ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [noProfileYet, setNoProfileYet] = useState(false);

  // ── Section 1: Background image ───────────────────────────────────────────
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  // ── Section 2: Profile fields ─────────────────────────────────────────────
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [description, setDescription] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Section 3: Availability slots ─────────────────────────────────────────
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newSlotDay, setNewSlotDay] = useState<number>(1); // Monday default
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("17:00");
  const [newSlotStatus, setNewSlotStatus] = useState<
    "UNAVAILABLE" | "CONFIRMED"
  >("UNAVAILABLE");

  const [savingSlots, setSavingSlots] = useState(false);
  const [slotsSuccess, setSlotsSuccess] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // ── Load on mount ─────────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      setLoadingProfile(true);
      setLoadError(null);
      setNoProfileYet(false);

      const { contractor } = await getContractorSettings();
      setProfile(contractor);
      setBackgroundUrl(contractor.backgroundImageUrl ?? null);
      setName(contractor.name ?? "");
      setAddress(contractor.address ?? "");
      setCity(contractor.city ?? "");
      setPhone(contractor.phone ?? "");
      setYearsOfExperience(
        contractor.yearsOfExperience != null
          ? String(contractor.yearsOfExperience)
          : ""
      );
      setDescription(contractor.description ?? "");
      setSpecializations(contractor.specializations ?? []);
      setSlots(contractor.availabilitySlots ?? []);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNoProfileYet(true);
      } else {
        setLoadError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load contractor settings"
        );
      }
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Background image handlers ─────────────────────────────────────────────

  const handlePickBackground = async () => {
    // ── Uncomment after installing expo-image-picker ──────────────────────
    // const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // if (!permission.granted) {
    //   Alert.alert("Permission required", "Allow photo library access to upload a background image.");
    //   return;
    // }
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [16, 9],
    //   quality: 0.8,
    // });
    // if (result.canceled || !result.assets?.length) return;
    // const asset = result.assets[0];
    // const filename = asset.fileName ?? `bg_${Date.now()}.jpg`;
    // try {
    //   setUploadingBg(true);
    //   const { uploadBackgroundImage } = await import("../../api/contractorSettingsApi");
    //   const { url } = await uploadBackgroundImage(asset.uri, filename);
    //   setBackgroundUrl(url);
    // } catch (e: any) {
    //   Alert.alert("Upload failed", e?.message ?? "Could not upload image.");
    // } finally {
    //   setUploadingBg(false);
    // }
    // ─────────────────────────────────────────────────────────────────────

    Alert.alert(
      "Not yet available",
      "Install expo-image-picker to enable background photo picking:\n\nnpx expo install expo-image-picker\n\nThen uncomment the ImagePicker block in app/(auth)/contractor.tsx"
    );
  };

  const handleDeleteBackground = () => {
    Alert.alert(
      "Remove background",
      "Remove the current background image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setUploadingBg(true);
              await deleteBackgroundImage(backgroundUrl ?? undefined);
              setBackgroundUrl(null);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.error ||
                  err?.message ||
                  "Failed to remove background"
              );
            } finally {
              setUploadingBg(false);
            }
          },
        },
      ]
    );
  };

  // ── Save profile ──────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setProfileSuccess(null);
    setProfileError(null);

    const payload: UpdateContractorProfileData = {
      specializations,
    };

    const trimmedName = name.trim();
    if (trimmedName) payload.name = trimmedName;

    const trimmedAddress = address.trim();
    if (trimmedAddress) payload.address = trimmedAddress;

    const trimmedCity = city.trim();
    if (trimmedCity) payload.city = trimmedCity;

    const trimmedPhone = phone.trim();
    if (trimmedPhone) payload.phone = trimmedPhone;

    const trimmedDesc = description.trim();
    if (trimmedDesc) payload.description = trimmedDesc;

    const yoe = parseInt(yearsOfExperience, 10);
    if (!isNaN(yoe)) payload.yearsOfExperience = yoe;

    if (backgroundUrl) payload.backgroundImageUrl = backgroundUrl;

    try {
      setSavingProfile(true);
      const result = await updateContractorProfile(payload);
      if (result.error) {
        setProfileError(result.error);
        return;
      }
      setProfileSuccess(result.success ?? "Profile saved!");
      setNoProfileYet(false);
    } catch (err: any) {
      setProfileError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Specializations ───────────────────────────────────────────────────────

  const handleAddSpec = () => {
    const trimmed = newSpec.trim();
    if (!trimmed) return;
    if (specializations.includes(trimmed)) {
      setNewSpec("");
      return;
    }
    setSpecializations((prev) => [...prev, trimmed]);
    setNewSpec("");
  };

  const handleRemoveSpec = (spec: string) => {
    setSpecializations((prev) => prev.filter((s) => s !== spec));
  };

  // ── Availability slots ────────────────────────────────────────────────────

  const handleAddSlot = () => {
    // Validate HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newSlotStart) || !timeRegex.test(newSlotEnd)) {
      Alert.alert(
        "Invalid time",
        "Please enter times in HH:MM format (e.g. 09:00)"
      );
      return;
    }
    if (newSlotStart >= newSlotEnd) {
      Alert.alert("Invalid range", "Start time must be before end time.");
      return;
    }

    const newSlot: AvailabilitySlot = {
      dayOfWeek: newSlotDay,
      startTime: buildISOForSlot(newSlotDay, newSlotStart),
      endTime: buildISOForSlot(newSlotDay, newSlotEnd),
      status: newSlotStatus,
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    setSlotsSuccess(null);
    setSlotsError(null);

    const payload = slots.map(({ dayOfWeek, startTime, endTime, status }) => ({
      dayOfWeek,
      startTime,
      endTime,
      status: status ?? "UNAVAILABLE",
    }));

    try {
      setSavingSlots(true);
      const result = await saveAvailabilitySlots(payload);
      if (!result.success) {
        setSlotsError("Failed to save availability.");
        return;
      }
      // Sync returned (normalised) slots back to state
      setSlots(result.availabilitySlots);
      setSlotsSuccess("Availability saved!");
    } catch (err: any) {
      setSlotsError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save availability"
      );
    } finally {
      setSavingSlots(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading contractor settings…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSettings}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contractor Settings</Text>
      </View>

      {/* ── No-profile notice ──────────────────────────────────────────── */}
      {noProfileYet && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            You don't have a contractor profile yet. Fill in your details below
            and press "Save Profile" to create one.
          </Text>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — BACKGROUND IMAGE
      ══════════════════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Image</Text>

        {backgroundUrl ? (
          <Image
            source={{ uri: backgroundUrl }}
            style={styles.bgPreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bgPlaceholder}>
            <Text style={styles.bgPlaceholderText}>No background image</Text>
          </View>
        )}

        <View style={styles.bgButtons}>
          <TouchableOpacity
            style={[styles.bgBtn, uploadingBg && styles.disabledBtn]}
            onPress={handlePickBackground}
            disabled={uploadingBg}
          >
            {uploadingBg ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bgBtnText}>
                {backgroundUrl ? "Change Image" : "Upload Image"}
              </Text>
            )}
          </TouchableOpacity>

          {backgroundUrl && (
            <TouchableOpacity
              style={[styles.bgBtnDanger, uploadingBg && styles.disabledBtn]}
              onPress={handleDeleteBackground}
              disabled={uploadingBg}
            >
              <Text style={styles.bgBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — PROFILE INFO
      ══════════════════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Info</Text>

        {profileSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {profileSuccess}</Text>
          </View>
        )}
        {profileError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {profileError}</Text>
          </View>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your contractor name"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street address"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          placeholder="e.g. 5"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description of your services…"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Specializations */}
        <Text style={styles.label}>Specializations</Text>
        <View style={styles.specTagRow}>
          {specializations.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={styles.specTag}
              onPress={() => handleRemoveSpec(spec)}
            >
              <Text style={styles.specTagText}>{spec} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.specInputRow}>
          <TextInput
            style={[styles.input, styles.specInput]}
            value={newSpec}
            onChangeText={setNewSpec}
            placeholder="Add specialization…"
            placeholderTextColor="#9ca3af"
            onSubmitEditing={handleAddSpec}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addSpecBtn} onPress={handleAddSpec}>
            <Text style={styles.addSpecBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>Tap a tag to remove it.</Text>

        <TouchableOpacity
          style={[styles.saveBtn, savingProfile && styles.disabledBtn]}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — AVAILABILITY CALENDAR
      ══════════════════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>

        {slotsSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {slotsSuccess}</Text>
          </View>
        )}
        {slotsError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {slotsError}</Text>
          </View>
        )}

        {/* Current slots list */}
        {slots.length === 0 ? (
          <Text style={styles.helperText}>
            No availability slots yet. Add one below.
          </Text>
        ) : (
          slots.map((slot, i) => (
            <View key={i} style={styles.slotRow}>
              <View style={styles.slotInfo}>
                <Text style={styles.slotDay}>
                  {DAY_LABELS[slot.dayOfWeek]}
                </Text>
                <Text style={styles.slotTime}>
                  {isoToHHMM(slot.startTime)} – {isoToHHMM(slot.endTime)}
                </Text>
                <View
                  style={[
                    styles.slotStatusBadge,
                    slot.status === "CONFIRMED"
                      ? styles.slotStatusConfirmed
                      : styles.slotStatusUnavailable,
                  ]}
                >
                  <Text style={styles.slotStatusText}>
                    {slot.status ?? "UNAVAILABLE"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.slotRemoveBtn}
                onPress={() => handleRemoveSlot(i)}
              >
                <Text style={styles.slotRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Add new slot */}
        <View style={styles.addSlotBox}>
          <Text style={styles.label}>Day of Week</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayChipScroll}
          >
            {DAY_LABELS.map((label, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayChip,
                  newSlotDay === i && styles.dayChipActive,
                ]}
                onPress={() => setNewSlotDay(i)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    newSlotDay === i && styles.dayChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.label}>Start (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={newSlotStart}
                onChangeText={setNewSlotStart}
                placeholder="09:00"
                placeholderTextColor="#9ca3af"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.label}>End (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={newSlotEnd}
                onChangeText={setNewSlotEnd}
                placeholder="17:00"
                placeholderTextColor="#9ca3af"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {(["UNAVAILABLE", "CONFIRMED"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  newSlotStatus === s && styles.statusChipActive,
                ]}
                onPress={() => setNewSlotStatus(s)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    newSlotStatus === s && styles.statusChipTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addSlotBtn}
            onPress={handleAddSlot}
          >
            <Text style={styles.addSlotBtnText}>+ Add Slot</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, savingSlots && styles.disabledBtn]}
          onPress={handleSaveAvailability}
          disabled={savingSlots}
        >
          {savingSlots ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Availability</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 15,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: "#3b82f6",
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  // No-profile notice
  noticeBox: {
    backgroundColor: "#fef9c3",
    borderLeftWidth: 4,
    borderLeftColor: "#eab308",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  noticeText: {
    color: "#713f12",
    fontSize: 13,
    lineHeight: 18,
  },

  // Sections
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  // Background image
  bgPreview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  bgPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  bgPlaceholderText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  bgButtons: {
    flexDirection: "row",
    gap: 10,
  },
  bgBtn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  bgBtnDanger: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  bgBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Banners
  successBanner: {
    backgroundColor: "#dcfce7",
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  successText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
  },

  // Form
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 15,
    color: "#111827",
  },
  textArea: {
    minHeight: 96,
    paddingTop: 10,
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },

  // Specializations
  specTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  specTag: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  specTagText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "500",
  },
  specInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  specInput: {
    flex: 1,
    marginTop: 0,
  },
  addSpecBtn: {
    backgroundColor: "#6b7280",
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addSpecBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Save button
  saveBtn: {
    backgroundColor: "#3b82f6",
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.6,
  },

  // Slot list
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  slotInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  slotDay: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    width: 34,
  },
  slotTime: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  slotStatusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slotStatusConfirmed: {
    backgroundColor: "#dcfce7",
  },
  slotStatusUnavailable: {
    backgroundColor: "#fee2e2",
  },
  slotStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  slotRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
    marginLeft: 8,
  },
  slotRemoveBtnText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "600",
  },

  // Add slot form
  addSlotBox: {
    marginTop: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dayChipScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  dayChip: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
  },
  dayChipActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  dayChipTextActive: {
    color: "#1d4ed8",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  statusChip: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusChipActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  statusChipTextActive: {
    color: "#1d4ed8",
  },
  addSlotBtn: {
    backgroundColor: "#059669",
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  addSlotBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
