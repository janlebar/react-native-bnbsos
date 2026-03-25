// app/(auth)/settings.tsx
// Account Settings Screen
//
// Connects to Next.js backend documented in:
//   next-auth/Expo_integration/profile/settings/settings.md
//
// ⚠️  Avatar image-picking requires expo-image-picker.
//     Run: npx expo install expo-image-picker
//     and uncomment the ImagePicker lines below if you want native photo picking.

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
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import {
  getSettings,
  updateSettings,
  uploadAvatar,
  deleteAvatar,
  type SettingsUser,
  type UpdateSettingsData,
} from "../../api/settingsApi";

import * as ImagePicker from "expo-image-picker";

export default function SettingsScreen() {
  const router = useRouter();
  const { user: contextUser, updateUser } = useAuth();

  // ── Remote settings loaded from API ───────────────────────────────────────
  const [settingsUser, setSettingsUser] = useState<SettingsUser | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Security – credential users only
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Load settings on mount ────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      setLoadError(null);
      const { user } = await getSettings();
      setSettingsUser(user);
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setRole(user.role);
      setAvatarUrl(user.image ?? null);
      setTwoFactorEnabled(user.isTwoFactorEnabled);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to load settings";
      setLoadError(msg);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Avatar: pick from device ──────────────────────────────────────────────
  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to your photo library to change avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const filename = asset.fileName ?? `avatar_${Date.now()}.jpg`;
    try {
      setUploadingAvatar(true);
      const { url } = await uploadAvatar(asset.uri, filename);
      setAvatarUrl(url);
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Could not upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Avatar: delete ────────────────────────────────────────────────────────
  const handleDeleteAvatar = () => {
    Alert.alert(
      "Remove avatar",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setUploadingAvatar(true);
              await deleteAvatar(avatarUrl ?? undefined);
              setAvatarUrl(null);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.error || err?.message || "Failed to remove avatar"
              );
            } finally {
              setUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  // ── Save settings ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    // Build payload — use undefined (not null) for optional string fields so
    // the backend's Zod schema (z.string().optional()) doesn't reject them.
    //
    // ⚠️  Do NOT include `role` for non-admin users.  The backend returns 403
    //     when a USER-role account sends the `role` field in the payload.
    const payload: UpdateSettingsData = {};

    const trimmedName = name.trim();
    if (trimmedName) payload.name = trimmedName;

    const trimmedEmail = email.trim();
    if (trimmedEmail) payload.email = trimmedEmail;

    if (avatarUrl) payload.imageUrl = avatarUrl;

    // Only admins are allowed to change the role field.
    if (isAdmin) payload.role = role;

    // ── Credential users ───────────────────────────────────────────────────
    // The backend only requires the current password when the user is actively
    // setting a new one (newPassword is provided).  Simple profile updates
    // (name, avatar, 2FA toggle) do NOT require the current password.
    if (settingsUser && !settingsUser.isOAuth) {
      if (newPassword.trim()) {
        // Password change: current password is required to authorise it.
        if (!currentPassword.trim()) {
          setErrorMessage("Enter your current password to set a new one.");
          return;
        }
        if (newPassword.trim().length < 6) {
          setErrorMessage("New password must be at least 6 characters.");
          return;
        }
        payload.password = currentPassword.trim();
        payload.newPassword = newPassword.trim();
      }

      payload.isTwoFactorEnabled = twoFactorEnabled;
    }

    try {
      setSaving(true);
      const result = await updateSettings(payload);

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      setSuccessMessage(result.success ?? "Settings saved!");

      // Update auth context so the rest of the app reflects the new name/image
      updateUser({
        name: payload.name ?? contextUser?.name ?? null,
        image: payload.imageUrl ?? undefined,
        role: payload.role ?? contextUser?.role ?? "USER",
        isTwoFactorEnabled: twoFactorEnabled,
      });

      // Clear password fields after a successful save
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error || err?.message || "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loadingSettings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading settings…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOAuth = settingsUser?.isOAuth ?? false;
  const isAdmin = contextUser?.role === "ADMIN";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      {/* ── Feedback banners ──────────────────────────────────────────── */}
      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ {successMessage}</Text>
        </View>
      )}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {errorMessage}</Text>
        </View>
      )}

      {/* ── Avatar ────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.avatarRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(name || contextUser?.email || "?")[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.avatarButtons}>
            <TouchableOpacity
              style={[styles.avatarBtn, uploadingAvatar && styles.disabledBtn]}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.avatarBtnText}>
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                </Text>
              )}
            </TouchableOpacity>
            {avatarUrl && (
              <TouchableOpacity
                style={[styles.avatarBtnDanger, uploadingAvatar && styles.disabledBtn]}
                onPress={handleDeleteAvatar}
                disabled={uploadingAvatar}
              >
                <Text style={styles.avatarBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Profile Info ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Info</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.helperText}>
          Changing your email will send a verification message.
        </Text>

        {/* Role switcher – admin only */}
        {isAdmin && (
          <>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              {(["USER", "ADMIN"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      role === r && styles.roleChipTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* ── Security (credential users only) ─────────────────────────── */}
      {isOAuth ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.oauthNotice}>
            <Text style={styles.oauthNoticeText}>
              You signed in with a social provider. Password and two-factor
              authentication settings are managed by your provider.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Leave blank to keep current password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
          <Text style={styles.helperText}>
            Only required when setting a new password below.
          </Text>

          <Text style={[styles.label, { marginTop: 16 }]}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min. 6 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
          <Text style={styles.helperText}>
            Leave blank to keep your current password.
          </Text>

          <View style={styles.twoFactorRow}>
            <View>
              <Text style={styles.label}>Two-Factor Authentication</Text>
              <Text style={styles.helperText}>
                Require a code each time you sign in.
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
              thumbColor={Platform.OS === "android" ? "#fff" : undefined}
            />
          </View>
        </View>
      )}

      {/* ── Save Button ───────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledBtn]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

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
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
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

  // Banners
  successBanner: {
    backgroundColor: "#dcfce7",
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    color: "#15803d",
    fontSize: 14,
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorBannerText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "500",
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

  // Avatar
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e5e7eb",
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563eb",
  },
  avatarButtons: {
    flex: 1,
    gap: 8,
  },
  avatarBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  avatarBtnDanger: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  avatarBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Form fields
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
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9ca3af",
  },

  // Role chips
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  roleChip: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  roleChipActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  roleChipTextActive: {
    color: "#1d4ed8",
  },

  // 2FA row
  twoFactorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },

  // OAuth notice
  oauthNotice: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
  },
  oauthNoticeText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },

  // Save button
  saveButton: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
