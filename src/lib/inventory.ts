import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

export const PRODUCT_UNITS = [
  "piece",
  "dozen",
  "carton",
  "bale",
  "kg",
  "litre",
  "pack",
  "set",
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number | string | null | undefined) {
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount ?? 0);
  return nairaFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

export function isRemoteImageUri(uri: string | null | undefined) {
  return !!uri && /^https?:\/\//i.test(uri);
}

export async function pickProductPhotoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadProductPhoto({
  userId,
  productId,
  uri,
}: {
  userId: string;
  productId: string;
  uri: string;
}): Promise<{ publicUrl: string | null; error?: string }> {
  let compressedUri = uri;

  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    compressedUri = compressed.uri;
  } catch {
    // Compression is best-effort. We can still upload the original file.
  }

  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  });

  const filePath = `${userId}/${productId}.jpg`;
  const { error } = await supabase.storage
    .from("products")
    .upload(filePath, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    return { publicUrl: null, error: error.message };
  }

  const { data } = supabase.storage.from("products").getPublicUrl(filePath);
  return { publicUrl: data.publicUrl };
}
