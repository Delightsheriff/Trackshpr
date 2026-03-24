import type { Database } from "@/src/types/database"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

function getStorageItem(key: string): Promise<string | null> {
  try {
    return SecureStore.getItemAsync(key);
  } catch {
    return Promise.resolve(null);
  }
}

function setStorageItem(key: string, value: string): Promise<void> {
  try {
    return SecureStore.setItemAsync(key, value);
  } catch {
    return Promise.resolve();
  }
}

function removeStorageItem(key: string): Promise<void> {
  try {
    return SecureStore.deleteItemAsync(key);
  } catch {
    return Promise.resolve();
  }
}

const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: {
        getItem: getStorageItem,
        setItem: setStorageItem,
        removeItem: removeStorageItem,
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export { supabase };
