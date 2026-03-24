// api/contractorSettingsApi.ts
// Contractor Settings API for mobile profile management
// Connects to Next.js endpoints documented in:
// next-auth/Expo_integration/profile/contractor settings/contractorSettings.md

import { api } from "./authapi";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  startTime: string; // ISO datetime string
  endTime: string;   // ISO datetime string
  status?: "UNAVAILABLE" | "CONFIRMED";
}

export interface ContractorProfile {
  id: number;
  userId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  specializations: string[];
  yearsOfExperience: number | null;
  description: string | null;
  backgroundImageUrl: string | null;
  availabilitySlots: AvailabilitySlot[];
}

export interface GetContractorSettingsResponse {
  contractor: ContractorProfile;
}

/** Payload for POST /api/mobile/profile/contractor/update (AccountSchema). */
export interface UpdateContractorProfileData {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  specializations?: string[];
  yearsOfExperience?: number;
  description?: string;
  backgroundImageUrl?: string;
}

export interface SaveAvailabilitySlotsResponse {
  success: boolean;
  availabilitySlots: AvailabilitySlot[];
}

export interface UploadBackgroundResponse {
  url: string;
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * GET /api/mobile/profile/contractor
 * Returns the contractor profile + availability slots.
 * 404 means the user has no contractor profile yet (upsert on update creates one).
 */
export const getContractorSettings =
  async (): Promise<GetContractorSettingsResponse> => {
    const response = await api.get("/api/mobile/profile/contractor");
    return response.data;
  };

/**
 * POST /api/mobile/profile/contractor/update
 * Validated against AccountSchema.  No password required.
 * Uses upsert — safe to call even before a profile exists.
 */
export const updateContractorProfile = async (
  data: UpdateContractorProfileData
): Promise<{ success?: string; error?: string }> => {
  const response = await api.post(
    "/api/mobile/profile/contractor/update",
    data
  );
  return response.data;
};

/**
 * PUT /api/mobile/profile/contractor/availability
 * Replaces ALL existing availability slots with the provided list.
 * Pass an empty array to clear all slots.
 */
export const saveAvailabilitySlots = async (
  slots: Omit<AvailabilitySlot, "id">[]
): Promise<SaveAvailabilitySlotsResponse> => {
  const response = await api.put(
    "/api/mobile/profile/contractor/availability",
    { availabilitySlots: slots }
  );
  return response.data;
};

/**
 * POST /api/mobile/profile/contractor/background/upload-cropped
 * Uploads a cropped background image (multipart/form-data).
 * Returns { url } — pass that URL to updateContractorProfile to persist it.
 *
 * NOTE: Requires expo-image-picker to select the image first.
 *       Install with: npx expo install expo-image-picker
 */
export const uploadBackgroundImage = async (
  imageUri: string,
  filename: string
): Promise<UploadBackgroundResponse> => {
  const formData = new FormData();
  formData.append("croppedImage", {
    uri: imageUri,
    type: "image/jpeg",
    name: filename,
  } as any);
  formData.append("filename", filename);

  const response = await api.post(
    "/api/mobile/profile/contractor/background/upload-cropped",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

/**
 * DELETE /api/mobile/profile/contractor/background
 * Deletes the contractor's current background image and clears the DB field.
 * Optionally supply the known imageUrl for ownership verification.
 */
export const deleteBackgroundImage = async (
  imageUrl?: string
): Promise<{ success: boolean }> => {
  const response = await api.delete(
    "/api/mobile/profile/contractor/background",
    { data: imageUrl ? { imageUrl } : undefined }
  );
  return response.data;
};
