// api/settingsApi.ts
// Settings API for mobile profile management
// Connects to Next.js endpoints documented in:
// next-auth/Expo_integration/profile/settings/settings.md

import { api } from "./authapi";

// ─── Response / Request Types ──────────────────────────────────────────────

export interface SettingsUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  image: string | null;
  isTwoFactorEnabled: boolean;
  /** true = OAuth-only account (no password / 2FA allowed) */
  isOAuth: boolean;
}

export interface GetSettingsResponse {
  user: SettingsUser;
}

export interface UpdateSettingsData {
  /** Omit the field entirely (undefined) instead of sending null — Zod on the
   *  backend uses z.string().optional() and will reject null values. */
  name?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  imageUrl?: string;
  /** current password – credential users only */
  password?: string;
  /** new password – credential users only */
  newPassword?: string;
  /** 2FA toggle – credential users only */
  isTwoFactorEnabled?: boolean;
}

export interface UpdateSettingsResponse {
  success?: string;
  error?: string;
}

export interface UploadAvatarResponse {
  url: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * GET /api/mobile/profile/settings
 * Fetches the current user's settings to pre-fill the form.
 */
export const getSettings = async (): Promise<GetSettingsResponse> => {
  const response = await api.get("/api/mobile/profile/settings");
  return response.data;
};

/**
 * POST /api/mobile/profile/settings/update
 * Updates profile fields. Omit password/newPassword/isTwoFactorEnabled for OAuth users.
 */
export const updateSettings = async (
  data: UpdateSettingsData
): Promise<UpdateSettingsResponse> => {
  const response = await api.post("/api/mobile/profile/settings/update", data);
  return response.data;
};

/**
 * POST /api/mobile/profile/settings/avatar/upload-cropped
 * Uploads a cropped avatar image (multipart/form-data).
 * Returns { url } to use as imageUrl in updateSettings.
 *
 * NOTE: Requires expo-image-picker to select the image first.
 *       Install with: npx expo install expo-image-picker
 */
export const uploadAvatar = async (
  imageUri: string,
  filename: string
): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  // React Native / Expo multipart body format
  formData.append("croppedImage", {
    uri: imageUri,
    type: "image/jpeg",
    name: filename,
  } as any);
  formData.append("filename", filename);

  const response = await api.post(
    "/api/mobile/profile/settings/avatar/upload-cropped",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

/**
 * DELETE /api/mobile/profile/settings/avatar
 * Deletes the user's current avatar.
 * Optionally pass the current imageUrl so the server can verify it matches.
 */
export const deleteAvatar = async (
  imageUrl?: string
): Promise<{ success: boolean }> => {
  const response = await api.delete("/api/mobile/profile/settings/avatar", {
    data: imageUrl ? { imageUrl } : undefined,
  });
  return response.data;
};
