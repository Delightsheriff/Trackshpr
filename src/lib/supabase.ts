import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import type { Database } from "@/src/types/database";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

function createWebStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: async () => null,
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };
  }
  return {
    getItem: async (key: string): Promise<string | null> => {
      return localStorage.getItem(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
      localStorage.setItem(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
      localStorage.removeItem(key);
    },
  };
}

async function getItem(key: string): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") {
    return undefined;
  }
  return localStorage.setItem(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (typeof window === "undefined") {
    return undefined;
  }
  return localStorage.removeItem(key);
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