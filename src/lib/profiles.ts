/**
 * Profile-related API calls: logo upload and profile upsert.
 */
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

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

  const res = await fetch(uri);
  const blob = await res.blob();

  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, blob, { upsert: true, contentType });

  if (error) return { publicUrl: null, error: error.message };

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return { publicUrl: data.publicUrl };
}

// ── Profile upsert ────────────────────────────────────────────────────────────

export interface ProfilePayload {
  id: string;
  business_name: string;
  phone: string;
  city?: string | null;
  brand_name?: string | null;
  logo_url?: string | null;
}

export async function saveProfile(
  payload: ProfilePayload,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("profiles").upsert({
    ...payload,
    city: payload.city ?? null,
    brand_name: payload.brand_name ?? null,
    logo_url: payload.logo_url ?? null,
    onboarding_complete: true,
  });

  return error ? { error: error.message } : {};
}
