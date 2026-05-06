import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import type { Database } from "@/src/types/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Use AsyncStorage for native platforms, localStorage for web
const isWeb = typeof window !== "undefined";

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseKey,
  {
    auth: {
      storage: {
        getItem,
        setItem,
        removeItem,
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export { supabase };