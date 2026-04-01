import { Redirect, Stack, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/src/lib/queryClient";
import { useAuthState } from "@/src/hooks/useAuthState";
import { getRedirectForSegments } from "@/src/lib/routeMap";
import SplashScreen from "@/src/components/splash";
import ToastOverlay from "@/src/components/shared/ToastOverlay";
import { useThemeStore } from "@/src/stores/themeStore";

import "../global.css";

export default function RootLayout() {
  const status = useAuthState();
  const segments = useSegments();
  const redirectRoute = getRedirectForSegments(status, segments);

  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);

  if (status === "loading") {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          {redirectRoute ? (
            <Redirect href={redirectRoute as any} />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(modals)/new-delivery" options={{ presentation: "modal" }} />
              <Stack.Screen name="(modals)/select-customer" options={{ presentation: "modal" }} />
              <Stack.Screen name="(modals)/select-rider" options={{ presentation: "modal" }} />
              <Stack.Screen name="(settings)/business-details" />
              <Stack.Screen name="(settings)/brand-customization" />
              <Stack.Screen name="(settings)/account" />
              <Stack.Screen name="(screens)/order-detail" />
              <Stack.Screen name="(screens)/rider-detail" />
              <Stack.Screen name="(screens)/analytics" />
              <Stack.Screen name="(screens)/fleet-map" />
              <Stack.Screen name="(screens)/rider-link" />
              <Stack.Screen name="(screens)/track-link" />
              <Stack.Screen name="(modals)/add-rider" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/edit-rider" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/delete-rider" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/add-customer" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/delete-customer" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/sign-out" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="(modals)/delete-account" options={{ presentation: "transparentModal" }} />
            </Stack>
          )}

          <ToastOverlay />
          <StatusBar style={isDark ? "light" : "dark"} />
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
