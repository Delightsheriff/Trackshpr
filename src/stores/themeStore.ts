/**
 * Theme store — persisted Zustand store (DS §9.1).
 * Drives all color tokens across the app.
 * Usage: const { colors, isDark } = useTheme()
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { colors as lightColors } from "@/src/constants/tokens";

// Dark mode colors (DS §2.2)
const darkColors = {
  primary:          '#6366F1',
  primaryDim:       '#4647D3',
  primaryContainer: '#9396FF',
  primarySoft:      '#1e1f4a',
  surface:              '#0f0e1a',
  surfaceContainer:     '#1a1828',
  surfaceCard:          '#1e1c2e',
  surfaceElevated:      '#252338',
  surfaceHighlight:     '#2a2840',
  textPrimary:   '#EEEAF8',
  textSecondary: '#A89EC0',
  textMuted:     '#6B6180',
  success:    '#34D399',
  successBg:  '#0d2e22',
  warning:    '#FBBF24',
  warningBg:  '#2a1f08',
  error:      '#F87171',
  errorBg:    '#2e0f0f',
  info:       '#60A5FA',
  infoBg:     '#0d1f38',
  border:     'rgba(99, 102, 241, 0.1)',
  overlay:    'rgba(0, 0, 0, 0.6)',
  white:      '#FFFFFF',
} as const;

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

export const useTheme = () => useThemeStore((s) => ({ colors: s.colors, isDark: s.isDark }));
