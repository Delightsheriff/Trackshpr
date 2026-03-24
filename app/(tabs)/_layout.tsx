/**
 * Tab navigator shell.
 * Custom tab bar: frosted glass 68px, raised gradient FAB center (52×52 r18),
 * active dot below label, Feather icons. DS §8.5.
 */
import { font, gradients, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Height = 68px visible nav area + device safe area below home indicator
  const barHeight = 68 + insets.bottom;
  const paddingBottom = insets.bottom + 6;

  return (
    <View
      style={[
        styles.bar,
        {
          height: barHeight,
          paddingBottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {VISUAL_TABS.map((tab) => {
        if (tab.isFab) {
          return (
            <View key={tab.label} style={styles.fabWrap}>
              {/* Outer wrapper carries elevation so Android renders rounded shadow */}
              <View
                style={[
                  styles.fabShadow,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
              >
                <Pressable
                  onPress={() => router.push("/(modals)/new-delivery")}
                  android_ripple={{
                    color: "rgba(255,255,255,0.2)",
                    borderless: false,
                  }}
                  style={styles.fabPressable}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fab}
                  >
                    <Feather name={tab.icon} size={24} color={colors.white} />
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
            key={tab.label}
            onPress={() =>
              tab.routeName !== "fab" && navigation.navigate(tab.routeName)
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
                { color: isActive ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={[styles.activeDot, { backgroundColor: colors.primary }]}
              />
            )}
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
    alignItems: "flex-start", // align from top of content area, not centre
    paddingTop: 10, // ~10px from border to icons — matches HTML spec 8px
    borderTopWidth: 1,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "500",
    letterSpacing: 0.03 * 9,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
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
    backgroundColor: "#4647D3",
    // iOS
    shadowColor: "#4647D3",
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
