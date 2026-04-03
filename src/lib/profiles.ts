/**
 * Profile-related API calls: logo upload (with compression), profile upsert.
 */
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import type { ContactNumber } from "./supabaseQueries";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  id: string;
  business_name: string;
  phone: string;                   // derived from primary contact for compat
  city?: string | null;
  description?: string | null;
  brand_name?: string | null;
  brand_color?: string | null;
  display_option?: string | null;
  logo_url?: string | null;
  secondary_phone?: string | null; // derived from second contact for compat
  pickup_address?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  contact_numbers?: ContactNumber[] | null;
  onboarding_complete?: boolean;
}

// ── Logo ──────────────────────────────────────────────────────────────────────

export async function pickLogoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, // we compress below — don't double-compress here
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadLogo(
  userId: string,
  uri: string,
): Promise<{ publicUrl: string | null; error?: string }> {
  // Compress before upload: resize to 400×400, 80% JPEG quality
  let compressedUri = uri;
  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    compressedUri = compressed.uri;
  } catch {
    // Non-critical — fall through with original uri
  }

  const ext = "jpg"; // always JPEG after compression
  const fileName = `${userId}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  });

  // Delete stale file first so CDN doesn't serve a cached version
  await supabase.storage.from("logos").remove([fileName]);

  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, decode(base64), { contentType: "image/jpeg" });

  if (error) return { publicUrl: null, error: error.message };

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return { publicUrl: data.publicUrl };
}

// ── Profile upsert ────────────────────────────────────────────────────────────

export async function saveProfile(payload: ProfilePayload): Promise<void> {
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
    contact_numbers: payload.contact_numbers ?? null,
    onboarding_complete: payload.onboarding_complete ?? true,
  });

  if (error) throw new Error(error.message);
}
