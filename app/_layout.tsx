import ToastOverlay from "@/src/components/shared/ToastOverlay";
import SplashScreen from "@/src/components/splash";
import { supabase } from "@/src/lib/supabase";
import { useThemeStore } from "@/src/stores/themeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export { queryClient };

const ONBOARDING_SEEN_KEY = "onboarding_seen";

type Destination =
  | "/onboarding"
  | "/(auth)/sign-in"
  | "/(auth)/profile-setup"
  | "/(tabs)";

const AUTH_ROUTES: Destination[] = [
  "/onboarding",
  "/(auth)/sign-in",
  "/(auth)/profile-setup",
];

const isAuthRoute = (path: string): boolean => AUTH_ROUTES.includes(path as Destination);

async function getOnboardingSeen(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingSeen(seen: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, seen ? "true" : "false");
  } catch {}
}

async function getDestinationForSession(
  session: { user: { id: string } } | null,
): Promise<Destination> {
  if (!session) {
    const seen = await getOnboardingSeen();
    return seen ? "/(auth)/sign-in" : "/onboarding";
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, onboarding_complete")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return "/(auth)/profile-setup";
  }

  return "/(tabs)";
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);

  const [authReady, setAuthReady] = useState(false);
  const [initialDestination, setInitialDestination] = useState<Destination | null>(null);
  const hasInitiallyRedirected = useRef(false);

  const redirect = useCallback(
    (destination: Destination) => {
      if (pathname === destination) return;
      if (pathname === "/" && destination !== "/onboarding") {
        router.replace(destination);
        return;
      }
      router.replace(destination);
    },
    [pathname, router],
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        const destination = await getDestinationForSession(session);
        setInitialDestination(destination);
      } catch {
        if (!mounted) return;
        setInitialDestination("/(auth)/sign-in");
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !initialDestination) return;
    if (hasInitiallyRedirected.current) return;
    
    hasInitiallyRedirected.current = true;
    redirect(initialDestination);
  }, [authReady, initialDestination, redirect]);

  useEffect(() => {
    if (!authReady) return;
    if (!hasInitiallyRedirected.current) return;
    if (pathname === "/") return;

    const isTabRoute = pathname.startsWith("/(tabs)");
    if (isTabRoute && pathname !== "/(tabs)") return;

    const isAuthPath = isAuthRoute(pathname);
    if (isAuthPath) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const destination = await getDestinationForSession(session);
      
      if (destination !== "/(tabs)" && pathname !== destination) {
        redirect(destination);
      }
    };

    const timeout = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeout);
  }, [pathname, authReady, redirect]);

  if (!authReady || !initialDestination) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: colors.surface }}
      >
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(modals)/new-delivery"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="(modals)/select-customer"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="(modals)/select-rider"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="(settings)/business-details"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(settings)/brand-customization"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/order-detail"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/rider-detail"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/analytics"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/fleet-map"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/rider-link"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(screens)/track-link"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(modals)/add-rider"
              options={{ headerShown: false, presentation: "transparentModal" }}
            />
            <Stack.Screen
              name="(modals)/delete-rider"
              options={{ headerShown: false, presentation: "transparentModal" }}
            />
            <Stack.Screen
              name="(modals)/add-customer"
              options={{ headerShown: false, presentation: "transparentModal" }}
            />
            <Stack.Screen
              name="(modals)/delete-customer"
              options={{ headerShown: false, presentation: "transparentModal" }}
            />
          </Stack>
          <ToastOverlay />
          <StatusBar style={isDark ? "light" : "dark"} />
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
