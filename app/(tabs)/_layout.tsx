/**
 * Tab navigator shell.
 * Custom tab bar: liquid glass (BlurView iOS / opaque fallback Android),
 * raised gradient FAB center (52×52 r18), active dot, Feather icons. DS §8.5.
 */
import {
  font,
  gradients,
  radius,
  shadowsLight,
  shadowsDark,
} from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import Feather from "@expo/vector-icons/Feather";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_HEIGHT = 68; // visible zone (px), excluding safe area
const FAB_SIZE = 52;
const FAB_FLOAT = 18; // how far FAB rises above the bar's top border (px)

type TabRoute = "index" | "orders" | "riders" | "settings";
type TabIcon = "home" | "package" | "user" | "settings" | "plus";

const VISUAL_TABS: {
  routeName: TabRoute | "fab";
  icon: TabIcon;
  label: string;
  isFab?: boolean;
}[] = [
  { routeName: "index", icon: "home", label: "Home" },
  { routeName: "orders", icon: "package", label: "Orders" },
  { routeName: "fab", icon: "plus", label: "", isFab: true },
  { routeName: "riders", icon: "user", label: "Riders" },
  { routeName: "settings", icon: "settings", label: "Settings" },
];

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const totalHeight = BAR_HEIGHT + insets.bottom;
  const fabShadow = isDark ? shadowsDark.fab : shadowsLight.fab;

  // FAB marginTop calculation:
  // With alignItems:"center" in BAR_HEIGHT zone, FAB(52px) top is at (68-52)/2 = 8px from bar top.
  // We want FAB to float FAB_FLOAT px above the top border.
  // So marginTop = -(8 + FAB_FLOAT) = -(8 + 18) = -26
  const fabMarginTop = -((BAR_HEIGHT - FAB_SIZE) / 2 + FAB_FLOAT);

  // Tint colors for BlurView
  const blurTint = isDark ? "dark" : "light";
  // Overlay tints the blur slightly toward the surface color
  const overlayColor = isDark
    ? "rgba(15, 14, 26, 0.55)"
    : "rgba(250, 244, 255, 0.55)";
  // Android fallback (no blur support)
  const androidBg = isDark
    ? "rgba(15, 14, 26, 0.97)"
    : "rgba(250, 244, 255, 0.97)";

  return (
    <View style={[styles.container, { height: totalHeight, borderTopColor: colors.border }]}>
      {/* Background: liquid glass on iOS, opaque on Android */}
      {Platform.OS === "ios" ? (
        <>
          <BlurView
            intensity={72}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
          />
        </>
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: androidBg }]}
        />
      )}

      {/* Content: 68px visual zone */}
      <View style={[styles.row, { paddingBottom: insets.bottom }]}>
        {VISUAL_TABS.map((tab) => {
          if (tab.isFab) {
            return (
              <View key="fab" style={[styles.fabWrap, { marginTop: fabMarginTop }]}>
                <View
                  style={[
                    styles.fabShadowWrap,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: fabShadow.shadowColor,
                      shadowOffset: fabShadow.shadowOffset,
                      shadowOpacity: fabShadow.shadowOpacity,
                      shadowRadius: fabShadow.shadowRadius,
                      elevation: fabShadow.elevation,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => router.push("/(modals)/new-delivery")}
                    android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
                    style={styles.fabPressable}
                  >
                    <LinearGradient
                      colors={gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.fab}
                    >
                      <Feather name="plus" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            );
          }

          const routeIndex = state.routes.findIndex(
            (r) => r.name === tab.routeName,
          );
          const isActive = routeIndex === state.index;

          return (
            <Pressable
              key={tab.routeName}
              onPress={() =>
                tab.routeName !== "fab" &&
                navigation.navigate(tab.routeName)
              }
              style={styles.tabItem}
              android_ripple={{ color: colors.primarySoft, borderless: true }}
            >
              <Feather
                name={tab.icon}
                size={22}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.primary : colors.textMuted,
                    fontFamily: isActive
                      ? font.sans.bold
                      : font.sans.regular,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    // total height = BAR_HEIGHT + insets.bottom (set inline)
    borderTopWidth: 1,
    overflow: "visible", // allows FAB to float above
  },
  row: {
    flexDirection: "row",
    height: BAR_HEIGHT,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.27,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    marginTop: 1,
  },
  fabWrap: {
    flex: 1,
    alignItems: "center",
    // marginTop applied inline (floats FAB above border)
  },
  fabShadowWrap: {
    borderRadius: 18,
    // shadow and bg applied inline (theme-aware)
  },
  fabPressable: {
    borderRadius: 18,
    overflow: "hidden",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar {...(props as Parameters<typeof CustomTabBar>[0])} />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="riders" options={{ title: "Riders" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
