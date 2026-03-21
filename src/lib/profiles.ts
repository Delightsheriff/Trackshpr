/**
 * Profile-related API calls: logo upload, profile load, and profile upsert.
 */
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  id: string;
  business_name: string;
  phone: string;
  city?: string | null;
  brand_name?: string | null;
  logo_url?: string | null;
  secondary_phone?: string | null;
  pickup_address?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  onboarding_complete?: boolean;
}

export interface Profile {
  id: string;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  brand_name: string | null;
  logo_url: string | null;
  secondary_phone: string | null;
  pickup_address: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  onboarding_complete: boolean;
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

  const res = await fetch(uri);
  const blob = await res.blob();

  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, blob, { upsert: true, contentType });

  if (error) return { publicUrl: null, error: error.message };

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return { publicUrl: data.publicUrl };
}

// ── Profile fetch ─────────────────────────────────────────────────────────────

export async function fetchProfile(
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return {
    ...(data as unknown as Profile),
    secondary_phone: (data as Record<string, unknown>).secondary_phone as string | null ?? null,
    pickup_address: (data as Record<string, unknown>).pickup_address as string | null ?? null,
    instagram_handle: (data as Record<string, unknown>).instagram_handle as string | null ?? null,
    tiktok_handle: (data as Record<string, unknown>).tiktok_handle as string | null ?? null,
  };
}

// ── Profile upsert ────────────────────────────────────────────────────────────

export async function saveProfile(
  payload: ProfilePayload,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("profiles").upsert({
    ...payload,
    city: payload.city ?? null,
    brand_name: payload.brand_name ?? null,
    logo_url: payload.logo_url ?? null,
    secondary_phone: payload.secondary_phone ?? null,
    pickup_address: payload.pickup_address ?? null,
    instagram_handle: payload.instagram_handle ?? null,
    tiktok_handle: payload.tiktok_handle ?? null,
    onboarding_complete: payload.onboarding_complete ?? true,
  });

  return error ? { error: error.message } : {};
}
