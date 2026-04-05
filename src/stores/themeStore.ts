/**
 * Theme store - persisted Zustand store (DS 9.1).
 * Drives all color tokens across the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { darkColors, lightColors } from "@/src/constants/tokens";

type Colors = typeof lightColors;

interface ThemeState {
  isDark: boolean;
  colors: Colors;
  hasHydrated: boolean;
  toggle: () => void;
  setMode: (isDark: boolean) => void;
  setHydrated: (hasHydrated: boolean) => void;
  reset: () => void;
}

const getColorsForMode = (isDark: boolean): Colors =>
  (isDark ? darkColors : lightColors) as Colors;

const initialThemeState = {
  isDark: false,
  colors: lightColors as Colors,
  hasHydrated: false,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...initialThemeState,
      toggle: () =>
        set((state) => {
          const next = !state.isDark;
          return { isDark: next, colors: getColorsForMode(next) };
        }),
      setMode: (isDark) => set({ isDark, colors: getColorsForMode(isDark) }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      reset: () => set({ ...initialThemeState, hasHydrated: true }),
    }),
    {
      name: "trackshpr-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isDark: state.isDark }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          useThemeStore.setState({ ...initialThemeState, hasHydrated: true });
          return;
        }
        state.setMode(state.isDark);
        state.setHydrated(true);
      },
    },
  ),
);

export const useTheme = () => {
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);

  return { colors, isDark, hasHydrated };
};
