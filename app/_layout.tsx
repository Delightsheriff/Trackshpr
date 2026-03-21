/**
 * Root layout — entry point for all routes.
 *
 * Responsibilities:
 *  1. Show splash screen while auth state is being determined
 *  2. Redirect to correct screen based on auth state (useAuthGuard)
 *  3. Set up Supabase auth listener for session changes
 *  4. Render global UI (ToastOverlay, StatusBar)
 *
 * Design system: DS §9.1, §9.2
 */
import SplashScreen from "@/src/components/splash";
import ToastOverlay from "@/src/components/shared/ToastOverlay";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useThemeStore } from "@/src/stores/themeStore";
import { supabase } from "@/src/lib/supabase";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";

export default function RootLayout() {
  const router = useRouter();
  const authState = useAuthGuard();
  const colors = useThemeStore((s) => s.colors);
  const isDark  = useThemeStore((s) => s.isDark);

  // ── Auth state change listener ────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          router.replace("/(auth)/sign-in");
          return;
        }

        if (event === "SIGNED_IN" && session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_complete")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!profile?.onboarding_complete) {
            router.replace("/(auth)/profile-setup");
          } else {
            router.replace("/(tabs)");
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // ── Deferred redirect — useEffect avoids setState during render ────────────
  useEffect(() => {
    if (authState.loading) return;
    switch (authState.destination) {
      case "onboarding":
        router.replace("/onboarding");
        break;
      case "sign-in":
        router.replace("/(auth)/sign-in");
        break;
      case "profile-setup":
        router.replace("/(auth)/profile-setup");
        break;
      case "app":
        break;
    }
  }, [authState, router]);

  // ── Render splash while auth state is being determined ─────────────────────
  if (authState.loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SplashScreen />
      </GestureHandlerRootView>
    );
  }

  // ── Shell (renders behind redirect) ──────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
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
