/**
 * Tab navigator shell.
 * Custom tab bar: frosted glass 68px, raised gradient FAB center (52×52 r18),
 * active dot below label, Feather icons. DS §8.5.
 */
import { colors, font, gradients, radius } from "@/src/constants/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Visual order: Home · Orders · [FAB] · Riders · Settings
const VISUAL_TABS: {
  routeIdx: number; // index in state.routes (-1 = FAB / no real route)
  emoji: string;
  label: string;
  isFab?: boolean;
}[] = [
  { routeIdx: 0, emoji: "🏠", label: "Home" },
  { routeIdx: 1, emoji: "📦", label: "Orders" },
  { routeIdx: -1, emoji: "➕", label: "",   isFab: true },
  { routeIdx: 2, emoji: "🚴", label: "Riders" },
  { routeIdx: 3, emoji: "⚙️", label: "Settings" },
];

function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();

  // Height = 68px visible nav area + device safe area below home indicator
  const barHeight     = 68 + insets.bottom;
  const paddingBottom = insets.bottom + 6;

  return (
    <View style={[styles.bar, { height: barHeight, paddingBottom }]}>
      {VISUAL_TABS.map((tab) => {
        if (tab.isFab) {
          return (
            <View key="fab" style={styles.fabWrap}>
              {/* Outer wrapper carries elevation so Android renders rounded shadow */}
              <View style={styles.fabShadow}>
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
                    <Text style={styles.fabEmoji}>➕</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          );
        }

        const isActive  = state.index === tab.routeIdx;
        const routeName = state.routes[tab.routeIdx]?.name;

        return (
          <Pressable
            key={tab.label}
            onPress={() => routeName && navigation.navigate(routeName)}
            style={styles.tabItem}
            android_ripple={{ color: colors.primarySoft, borderless: true }}
          >
            <Text style={[styles.tabEmoji, isActive && styles.tabEmojiActive]}>
              {tab.emoji}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    // height set inline: 68 + insets.bottom
    // paddingBottom set inline: insets.bottom + 6
    // Content (icons) sits centred in the 68px visible zone
    alignItems: "flex-start",   // align from top of content area, not centre
    paddingTop: 10,             // ~10px from border to icons — matches HTML spec 8px
    backgroundColor: "rgba(250,244,255,0.94)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.45,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  fabEmoji: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    color: colors.textMuted,
    letterSpacing: 0.03 * 9,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 1,
  },

  // FAB — raised above nav bar border
  // marginTop moves it up from paddingTop (10) by 14px → sits 4px above border
  fabWrap: {
    flex: 1,
    alignItems: "center",
    marginTop: -14,
  },
  fabShadow: {
    borderRadius: 18,
    backgroundColor: colors.primary,
    // iOS
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    // Android
    elevation: 12,
  },
  fabPressable: {
    borderRadius: 18,
    overflow: "hidden",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as Parameters<typeof CustomTabBar>[0])} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: "Home" }} />
      <Tabs.Screen name="orders"   options={{ title: "Orders" }} />
      <Tabs.Screen name="riders"   options={{ title: "Riders" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
