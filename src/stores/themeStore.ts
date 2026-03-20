/**
 * Theme store — persisted Zustand store (DS §9.1).
 * Drives all color tokens across the app.
 * Usage: const { colors, isDark } = useTheme()
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { darkColors, lightColors } from "@/src/constants/tokens";

type Colors = typeof lightColors;

interface ThemeState {
  isDark: boolean;
  colors: Colors;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      colors: lightColors,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next, colors: next ? (darkColors as unknown as Colors) : lightColors });
      },
    }),
    { name: "trackshpr-theme", storage: createJSONStorage(() => AsyncStorage) }
  )
);

// Use two separate selectors so each returns a stable primitive/reference.
// A single selector returning `{ colors, isDark }` creates a new object every
// getSnapshot call, which triggers React's "infinite loop" warning.
export const useTheme = () => {
  const colors = useThemeStore((s) => s.colors);
  const isDark  = useThemeStore((s) => s.isDark);
  return { colors, isDark };
};
