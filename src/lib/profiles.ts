/**
 * Profile-related API calls: logo upload (with compression), profile upsert.
 */
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import type { Database } from "@/src/types/database";
import type { ContactNumber } from "./supabaseQueries";

export interface ProfilePayload {
  id: string;
  business_name?: string | null;
  phone?: string | null;
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
  contact_numbers?: ContactNumber[] | null;
  onboarding_complete?: boolean;
  is_pro?: boolean;
}

export async function pickLogoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadLogo(
  userId: string,
  uri: string,
): Promise<{ publicUrl: string | null; error?: string }> {
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
    // Compression is best-effort. Fall back to the original file if it fails.
  }

  const fileName = `${userId}.jpg`;
  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  });

  await supabase.storage.from("logos").remove([fileName]);

  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, decode(base64), { contentType: "image/jpeg" });

  if (error) {
    return { publicUrl: null, error: error.message };
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
  return { publicUrl: data.publicUrl };
}

export function getProfileContactNumbers(profile: {
  contact_numbers?: ContactNumber[] | null;
  phone?: string | null;
  secondary_phone?: string | null;
} | null): ContactNumber[] {
  if (profile?.contact_numbers?.length) {
    return profile.contact_numbers;
  }

  const fallback = [
    profile?.phone
      ? {
          number: profile.phone,
          label: "WhatsApp",
          is_whatsapp: true,
          is_primary: true,
        }
      : null,
    profile?.secondary_phone
      ? {
          number: profile.secondary_phone,
          label: "Office",
          is_whatsapp: false,
          is_primary: false,
        }
      : null,
  ].filter(Boolean) as ContactNumber[];

  if (fallback.length > 0) {
    return fallback;
  }

  return [
    {
      number: "",
      label: "WhatsApp",
      is_whatsapp: true,
      is_primary: true,
    },
  ];
}

export function getLegacyPhoneFields(contactNumbers: ContactNumber[]) {
  const primaryContact =
    contactNumbers.find((entry) => entry.is_primary) ?? contactNumbers[0];
  const secondaryContact = contactNumbers.find(
    (entry) => entry.number && entry.number !== primaryContact?.number,
  );

  return {
    phone: primaryContact?.number ?? "",
    secondary_phone: secondaryContact?.number ?? null,
  };
}

export async function saveProfile(payload: ProfilePayload): Promise<void> {
  const update: Record<string, unknown> = { id: payload.id };
  const keys: (keyof Omit<ProfilePayload, "id">)[] = [
    "business_name",
    "phone",
    "city",
    "description",
    "brand_name",
    "brand_color",
    "display_option",
    "logo_url",
    "secondary_phone",
    "pickup_address",
    "instagram_handle",
    "tiktok_handle",
    "contact_numbers",
    "onboarding_complete",
    "is_pro",
  ];

  for (const key of keys) {
    if (key in payload) {
      update[key] = payload[key] ?? null;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(update as Database["public"]["Tables"]["profiles"]["Insert"], { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }
}
