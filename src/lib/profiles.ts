/**
 * Profile-related API calls: logo upload, profile load, and profile upsert.
 */
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  id: string;
  business_name: string;
  phone: string;
  city?: string | null;
  description?: string | null;
  brand_name?: string | null;
  brand_color?: string | null;
  display_option?: string | null;
  logo_url?: string | null;
  secondary_phone?: string | null;
  pickup_address?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  onboarding_complete?: boolean;
}

// ── Logo ──────────────────────────────────────────────────────────────────────

export async function pickLogoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadLogo(
  userId: string,
  uri: string,
): Promise<{ publicUrl: string | null; error?: string }> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${userId}.${ext}`;
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  // Delete before re-uploading so the CDN doesn't serve a stale cached version
  await supabase.storage.from("logos").remove([fileName]);

  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, decode(base64), { contentType });

  if (error) return { publicUrl: null, error: error.message };

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return { publicUrl: data.publicUrl };
}

// ── Profile upsert ────────────────────────────────────────────────────────────

export async function saveProfile(
  payload: ProfilePayload,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("profiles").upsert({
    id: payload.id,
    business_name: payload.business_name,
    phone: payload.phone,
    city: payload.city ?? null,
    description: payload.description ?? null,
    brand_name: payload.brand_name ?? null,
    brand_color: payload.brand_color ?? null,
    display_option: payload.display_option ?? null,
    logo_url: payload.logo_url ?? null,
    secondary_phone: payload.secondary_phone ?? null,
    pickup_address: payload.pickup_address ?? null,
    instagram_handle: payload.instagram_handle ?? null,
    tiktok_handle: payload.tiktok_handle ?? null,
    onboarding_complete: payload.onboarding_complete ?? true,
  });

  return error ? { error: error.message } : {};
}
