/**
 * Tab navigator shell.
 * Custom tab bar: liquid glass (BlurView iOS / opaque Android),
 * raised center FAB (52×52 r18), active dot, Feather icons. DS §8.5.
 *
 * Layout strategy for raised FAB:
 *   The container includes a transparent overhang at the top (FAB_ABOVE px).
 *   The glass background starts at FAB_ABOVE, not at container top.
 *   The FAB is positioned absolutely at y=0, so it straddles the bar border.
 *   This keeps the FAB fully inside the container — no overflow clipping.
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
const BAR_HEIGHT = 68;  // visible bar zone height (px)
const FAB_SIZE   = 52;  // FAB button size (px)
const FAB_ABOVE  = 16;  // transparent zone above the bar border where FAB floats

type TabRoute = "index" | "orders" | "riders" | "settings";

const TABS: {
  routeName: TabRoute;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}[] = [
  { routeName: "index",    icon: "home",     label: "Home"     },
  { routeName: "orders",   icon: "package",  label: "Orders"   },
  { routeName: "riders",   icon: "user",     label: "Riders"   },
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

  const fabShadow = isDark ? shadowsDark.fab : shadowsLight.fab;
  const blurTint  = isDark ? "dark" : "light";
  const overlayColor = isDark ? "rgba(15,14,26,0.55)" : "rgba(250,244,255,0.55)";
  const androidBg   = isDark ? "rgba(15,14,26,0.97)"  : "rgba(250,244,255,0.97)";

  // Total container height: transparent FAB zone + bar + safe area
  const totalHeight = FAB_ABOVE + BAR_HEIGHT + insets.bottom;

  // Bar zone rect (absolute coords within container)
  const barTop = FAB_ABOVE;

  // Left/right halves of the tab items (FAB occupies the centre slot)
  const leftTabs  = TABS.slice(0, 2);  // Home, Orders
  const rightTabs = TABS.slice(2);     // Riders, Settings

  function isActive(routeName: TabRoute) {
    const idx = state.routes.findIndex((r) => r.name === routeName);
    return idx === state.index;
  }

  function renderTab(tab: (typeof TABS)[number]) {
    const active = isActive(tab.routeName);
    return (
      <Pressable
        key={tab.routeName}
        onPress={() => navigation.navigate(tab.routeName)}
        style={styles.tabItem}
        android_ripple={{ color: colors.primarySoft, borderless: true }}
      >
        <Feather
          name={tab.icon}
          size={22}
          color={active ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color:      active ? colors.primary    : colors.textMuted,
              fontFamily: active ? font.sans.bold    : font.sans.regular,
              fontWeight: active ? "700"             : "400",
            },
          ]}
        >
          {tab.label}
        </Text>
        {active && (
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        )}
      </Pressable>
    );
  }

  return (
    <View style={{ height: totalHeight }}>
      {/* ── Glass background — starts at barTop, NOT at container top ── */}
      <View
        style={[
          styles.barBackground,
          {
            top:            barTop,
            borderTopColor: colors.border,
          },
        ]}
      >
        {Platform.OS === "ios" ? (
          <>
            <BlurView intensity={72} tint={blurTint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: androidBg }]} />
        )}
      </View>

      {/* ── Tab items row — sits in the bar zone ── */}
      <View
        style={[
          styles.tabRow,
          { top: barTop, height: BAR_HEIGHT },
        ]}
      >
        {leftTabs.map(renderTab)}
        {/* Centre placeholder — same flex as each tab item */}
        <View style={styles.tabItem} />
        {rightTabs.map(renderTab)}
      </View>

      {/* ── FAB — absolutely positioned at top, straddles bar border ── */}
      <View style={[styles.fabContainer, { top: 0 }]}>
        <View
          style={[
            styles.fabShadowWrap,
            {
              backgroundColor:  colors.primary,
              shadowColor:      fabShadow.shadowColor,
              shadowOffset:     fabShadow.shadowOffset,
              shadowOpacity:    fabShadow.shadowOpacity,
              shadowRadius:     fabShadow.shadowRadius,
              elevation:        fabShadow.elevation,
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  barBackground: {
    position:      "absolute",
    left:          0,
    right:         0,
    bottom:        0,
    borderTopWidth: 1,
    overflow:      "hidden",
  },
  tabRow: {
    position:        "absolute",
    left:            0,
    right:           0,
    flexDirection:   "row",
    alignItems:      "center",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex:       1,
    alignItems: "center",
    gap:        3,
  },
  tabLabel: {
    fontSize:      9,
    letterSpacing: 0.27,
  },
  activeDot: {
    width:        4,
    height:       4,
    borderRadius: radius.full,
    marginTop:    1,
  },
  // FAB: horizontally centred over the middle column, vertically at top of container
  fabContainer: {
    position:   "absolute",
    left:       0,
    right:      0,
    alignItems: "center",
  },
  fabShadowWrap: {
    borderRadius: 18,
    marginTop:    0, // aligns to top of container (FAB_ABOVE zone)
  },
  fabPressable: {
    borderRadius: 18,
    overflow:     "hidden",
  },
  fab: {
    width:           FAB_SIZE,
    height:          FAB_SIZE,
    borderRadius:    18,
    alignItems:      "center",
    justifyContent:  "center",
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
      <Tabs.Screen name="index"    options={{ title: "Home"     }} />
      <Tabs.Screen name="orders"   options={{ title: "Orders"   }} />
      <Tabs.Screen name="riders"   options={{ title: "Riders"   }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
