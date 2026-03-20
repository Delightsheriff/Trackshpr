import ToastOverlay from "@/src/components/shared/ToastOverlay";
import { useThemeStore } from "@/src/stores/themeStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { View } from "react-native";

import "../global.css";

export default function RootLayout() {
  const colors = useThemeStore((s) => s.colors);
  const isDark  = useThemeStore((s) => s.isDark);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* ThemeProvider bg — eliminates flash of wrong background on cold start */}
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Stack>
          <Stack.Screen name="index"      options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "none" }} />
          <Stack.Screen name="(auth)"     options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
          {/* Full-screen modals */}
          <Stack.Screen name="(modals)/new-delivery"    options={{ headerShown: false, presentation: "modal" }} />
          <Stack.Screen name="(modals)/select-customer" options={{ headerShown: false, presentation: "modal" }} />
          <Stack.Screen name="(modals)/select-rider"    options={{ headerShown: false, presentation: "modal" }} />
          {/* Settings screens */}
          <Stack.Screen name="(settings)/business-details"    options={{ headerShown: false }} />
          <Stack.Screen name="(settings)/brand-customization" options={{ headerShown: false }} />
          {/* Detail / analytics screens */}
          <Stack.Screen name="(screens)/order-detail"  options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/rider-detail"  options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/analytics"     options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/fleet-map"     options={{ headerShown: false }} />
          {/* Magic link web views */}
          <Stack.Screen name="(screens)/rider-link"    options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/track-link"    options={{ headerShown: false }} />
          {/* Bottom-sheet modals */}
          <Stack.Screen name="(modals)/add-rider"       options={{ headerShown: false, presentation: "transparentModal" }} />
          <Stack.Screen name="(modals)/delete-rider"    options={{ headerShown: false, presentation: "transparentModal" }} />
          <Stack.Screen name="(modals)/add-customer"    options={{ headerShown: false, presentation: "transparentModal" }} />
          <Stack.Screen name="(modals)/delete-customer" options={{ headerShown: false, presentation: "transparentModal" }} />
        </Stack>
        <ToastOverlay />
        <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </GestureHandlerRootView>
  );
}
