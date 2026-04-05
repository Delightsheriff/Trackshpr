import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";
import { ONBOARDING_SEEN_KEY } from "./storageKeys";
import { useDataStore } from "@/src/stores/dataStore";
import { useOrderStore } from "@/src/stores/orderStore";
import { useThemeStore } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";

export async function resetLocalSessionState(queryClient?: QueryClient) {
  queryClient?.clear();

  useOrderStore.getState().reset();
  useDataStore.getState().reset();
  useToastStore.getState().reset();
  useThemeStore.getState().reset();

  await AsyncStorage.clear();
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
}
